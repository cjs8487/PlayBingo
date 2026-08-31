import { BingoMode } from '@prisma/client';
import {
    ChangeColorAction,
    JoinAction,
    JoinTeamAction,
    MarkAction,
    RevealedCell,
    SetTeamsEnabledAction,
    UnmarkAction,
} from '@playbingo/types';
import { WebSocket } from 'ws';
import { RoomTokenPayload } from '../../auth/RoomAuth';
import Room from '../../core/Room';
import {
    addMarkAction,
    createUpdatePlayer,
    createUpdateTeam,
    updateTeamsEnabled,
} from '../../database/Rooms';

jest.mock('../../database/Rooms', () => ({
    addChangeColorAction: jest.fn().mockResolvedValue(undefined),
    addChatAction: jest.fn().mockResolvedValue(undefined),
    addJoinAction: jest.fn().mockResolvedValue(undefined),
    addLeaveAction: jest.fn().mockResolvedValue(undefined),
    addMarkAction: jest.fn().mockResolvedValue(undefined),
    addUnmarkAction: jest.fn().mockResolvedValue(undefined),
    createUpdatePlayer: jest.fn().mockResolvedValue(undefined),
    createUpdateTeam: jest.fn().mockResolvedValue(undefined),
    setRoomBoard: jest.fn().mockResolvedValue(undefined),
    updateFinishTime: jest.fn().mockResolvedValue(undefined),
    updateRaceHandler: jest.fn().mockResolvedValue(undefined),
    updateStartTime: jest.fn().mockResolvedValue(undefined),
    updateTeamsEnabled: jest.fn().mockResolvedValue(undefined),
}));

const createRoom = (teamsEnabled = false) => {
    const room = new Room(
        'Room',
        'Game',
        'game',
        'room',
        '',
        'room-id',
        false,
        BingoMode.LINES,
        1,
        false,
        'Normal',
        1,
        undefined,
        undefined,
        undefined,
        teamsEnabled,
    );
    room.board = Array.from({ length: 5 }, (_, row) =>
        Array.from(
            { length: 5 },
            (_, col) =>
                ({
                    goal: {
                        id: `${row}-${col}`,
                        goal: 'Goal',
                        description: null,
                    },
                    completedTeams: [],
                    revealed: true,
                }) as RevealedCell,
        ),
    );
    room.computeVictoryMasks();
    return room;
};

const auth = (playerId: string, isSpectating = false): RoomTokenPayload => ({
    roomSlug: 'room',
    uuid: `${playerId}-connection`,
    playerId,
    isSpectating,
    isMonitor: true,
});

const socket = () =>
    ({ readyState: 0, send: jest.fn() }) as unknown as WebSocket;

const joinAction = (nickname: string) =>
    ({ action: 'join', payload: { nickname } }) as JoinAction;

// even a mocked resolved promise defers its continuation to a microtask, and the
// player write is chained behind the team write so the foreign key exists
const flushPersistence = () => new Promise(process.nextTick);

const chatTimestamp = expect.stringMatching(/^\[\d+:\d{2}:\d{2}\] $/);

describe('Room team workflows', () => {
    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('stamps chat messages with the elapsed race time', () => {
        jest.useFakeTimers();
        const start = new Date('2026-01-01T00:00:00.000Z');
        jest.setSystemTime(start);

        const room = createRoom();
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        room.handleStartTimer();
        expect(room.chatHistory).toContainEqual([
            '[0:00:00] ',
            { contents: 'Alice', color: 'blue' },
            ' has revealed the card.',
        ]);

        jest.setSystemTime(new Date(start.getTime() + 65_000));
        room.handleMark(
            { action: 'mark', payload: { row: 0, col: 0 } } as MarkAction,
            auth('alice'),
        );
        expect(room.chatHistory).toContainEqual([
            '[0:01:05] ',
            { contents: 'Alice', color: 'blue' },
            ' marked Goal (0,0)',
        ]);
    });

    it('creates a team for a joining player and exposes team-owned state', async () => {
        const room = createRoom();
        const result = room.handleJoin(
            joinAction('Alice'),
            auth('alice'),
            socket(),
        );

        expect(result.action).toBe('connected');
        expect(room.teams.size).toBe(1);
        expect(result).toMatchObject({
            roomData: { teamsEnabled: false },
        });
        const team = room.getTeamForPlayer('alice');
        expect(team).toMatchObject({ name: 'Alice', color: 'blue' });
        expect(room.getPlayerById('alice')?.teamId).toBe(team?.id);
        expect(createUpdateTeam).toHaveBeenCalledWith('room-id', team);
        await flushPersistence();
        expect(createUpdatePlayer).toHaveBeenCalledWith(
            'room-id',
            room.getPlayerById('alice'),
        );
        expect(room.chatHistory).toContainEqual([
            chatTimestamp,
            { contents: 'Alice', color: 'blue' },
            ' has joined.',
        ]);
    });

    it('names the team after the player and announces it when teams are enabled', () => {
        const room = createRoom(true);
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());

        const team = room.getTeamForPlayer('alice')!;
        expect(team.name).toBe("Alice's Team");
        expect(room.chatHistory).toContainEqual([
            chatTimestamp,
            { contents: 'Alice', color: 'blue' },
            " has joined playing for Alice's Team.",
        ]);
    });

    it('tracks marks by team ID and applies the team color', () => {
        const room = createRoom();
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        const team = room.getTeamForPlayer('alice')!;

        room.handleMark(
            { action: 'mark', payload: { row: 0, col: 0 } } as MarkAction,
            auth('alice'),
        );
        expect(room.board[0][0].completedTeams).toEqual([team.id]);
        expect(team.hasMarked(0, 0)).toBe(true);

        room.handleUnmark(
            { action: 'unmark', payload: { row: 0, col: 0 } } as UnmarkAction,
            auth('alice'),
        );
        expect(room.board[0][0].completedTeams).toEqual([]);
        expect(team.hasMarked(0, 0)).toBe(false);

        room.handleChangeColor(
            {
                action: 'changeColor',
                payload: { color: 'red' },
            } as ChangeColorAction,
            auth('alice'),
        );
        expect(team.color).toBe('red');
        expect(createUpdateTeam).toHaveBeenLastCalledWith('room-id', team);
    });

    it('permits joining another team only when teams are enabled', () => {
        const room = createRoom();
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        room.handleJoin(joinAction('Bob'), auth('bob'), socket());
        const aliceTeam = room.getTeamForPlayer('alice')!;

        const joinTeam = {
            action: 'joinTeam',
            payload: { teamId: aliceTeam.id },
        } as JoinTeamAction;
        expect(room.handleJoinTeam(joinTeam, auth('bob'))).toEqual({
            action: 'forbidden',
        });

        room.handleSetTeamsEnabled({
            action: 'setTeamsEnabled',
            payload: { enabled: true },
        } as SetTeamsEnabledAction);
        expect(updateTeamsEnabled).toHaveBeenCalledWith('room-id', true);
        expect(room.handleJoinTeam(joinTeam, auth('bob'))?.action).toBe(
            'joinedTeam',
        );
        expect(room.getTeamForPlayer('bob')).toBe(aliceTeam);
    });

    it('uses player names for single-player rooms and team names when enabled', () => {
        const room = createRoom(true);
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        const team = room.getTeamForPlayer('alice')!;

        expect(team.getDisplayName()).toBe("Alice's Team");
        room.handleSetTeamsEnabled({
            action: 'setTeamsEnabled',
            payload: { enabled: false },
        } as SetTeamsEnabledAction);
        expect(team.getDisplayName()).toBe('Alice');
    });

    it('attributes team actions to the acting player when teams are enabled', () => {
        const room = createRoom(true);
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        const player = room.getPlayerById('alice')!;
        const team = room.getTeamForPlayer('alice')!;

        expect(player.getDisplayName()).toBe("Alice's Team (Alice)");
        room.handleSetTeamsEnabled({
            action: 'setTeamsEnabled',
            payload: { enabled: false },
        } as SetTeamsEnabledAction);
        expect(player.getDisplayName()).toBe('Alice');
        room.handleSetTeamsEnabled({
            action: 'setTeamsEnabled',
            payload: { enabled: true },
        } as SetTeamsEnabledAction);

        room.handleMark(
            { action: 'mark', payload: { row: 1, col: 1 } } as MarkAction,
            auth('alice'),
        );
        expect(addMarkAction).toHaveBeenCalledWith(
            'room-id',
            'alice',
            team.id,
            1,
            1,
            expect.any(Date),
        );
        expect(room.chatHistory).toContainEqual([
            chatTimestamp,
            { contents: "Alice's Team (Alice)", color: 'blue' },
            ' marked Goal (1,1)',
        ]);
    });

    it('creates a team when a spectator starts playing', () => {
        const room = createRoom();
        room.handleJoin(joinAction('Alice'), auth('alice', true), socket());
        const player = room.getPlayerById('alice')!;
        expect(room.teams.size).toBe(0);
        expect(room.spectators.has('alice')).toBe(true);

        expect(room.setPlayerSpectating(player, false)).toBe(true);
        expect(room.spectators.has('alice')).toBe(false);
        expect(room.teams.size).toBe(1);
        const team = room.getTeamForPlayer('alice')!;
        expect(team.name).toBe('Alice');
        expect(player.teamId).toBe(team.id);
        expect(room.chatHistory).toContainEqual([
            chatTimestamp,
            { contents: 'Alice', color: 'blue' },
            ' is now playing.',
        ]);

        // already playing, nothing to do
        expect(room.setPlayerSpectating(player, false)).toBe(false);
    });

    it('tears down the team when a player starts spectating', () => {
        const room = createRoom();
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        const player = room.getPlayerById('alice')!;
        const team = room.getTeamForPlayer('alice')!;
        room.handleMark(
            { action: 'mark', payload: { row: 0, col: 0 } } as MarkAction,
            auth('alice'),
        );
        expect(room.board[0][0].completedTeams).toEqual([team.id]);

        expect(room.setPlayerSpectating(player, true)).toBe(true);
        expect(room.spectators.has('alice')).toBe(true);
        expect(room.teams.size).toBe(0);
        expect(player.teamId).toBeUndefined();
        // the team no longer exists, so its marks must not linger on the board
        expect(room.board[0][0].completedTeams).toEqual([]);

        // already spectating, nothing to do
        expect(room.setPlayerSpectating(player, true)).toBe(false);
    });

    it('keeps a shared team alive when one of its players starts spectating', () => {
        const room = createRoom();
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        room.handleJoin(joinAction('Bob'), auth('bob'), socket());
        const aliceTeam = room.getTeamForPlayer('alice')!;
        room.handleSetTeamsEnabled({
            action: 'setTeamsEnabled',
            payload: { enabled: true },
        } as SetTeamsEnabledAction);
        room.handleJoinTeam(
            {
                action: 'joinTeam',
                payload: { teamId: aliceTeam.id },
            } as JoinTeamAction,
            auth('bob'),
        );
        expect(room.teams.size).toBe(1);

        room.setPlayerSpectating(room.getPlayerById('bob')!, true);
        expect(room.teams.size).toBe(1);
        expect(aliceTeam.players.has('alice')).toBe(true);
        expect(aliceTeam.players.has('bob')).toBe(false);
    });
});
