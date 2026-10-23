import { BingoMode } from '@prisma/client';
import {
    ChangeColorAction,
    JoinAction,
    JoinTeamAction,
    MarkAction,
    RevealedCell,
    SetTeamsEnabledAction,
    ServerMessage,
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

const createRoom = (teamsEnabled = false, hideCard = false) => {
    const room = new Room(
        'Room',
        'Game',
        'game',
        'room',
        '',
        'room-id',
        hideCard,
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

        expect(player.getDisplayName()).toBe("Alice (Alice's Team)");
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
            { contents: "Alice (Alice's Team)", color: 'blue' },
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
    const openSocket = () =>
        ({ readyState: 1, send: jest.fn() }) as unknown as WebSocket;

    const boardMessages = (connection: WebSocket) =>
        (connection.send as jest.Mock).mock.calls
            .map(([raw]) => JSON.parse(raw as string) as ServerMessage)
            .filter((message) => message.action === 'syncBoard');

    it('syncs the new exploration view to every connection after changing teams', () => {
        const room = createRoom(true);
        room.exploration = true;
        room.alwaysRevealedMask = 1n;
        const first = openSocket();
        const second = openSocket();
        room.handleJoin(joinAction('Alice'), auth('alice'), first);
        room.handleJoin(
            joinAction('Alice'),
            { ...auth('alice'), uuid: 'second' },
            second,
        );
        room.handleJoin(joinAction('Bob'), auth('bob'), openSocket());
        const oldTeam = room.getTeamForPlayer('alice')!;
        const newTeam = room.getTeamForPlayer('bob')!;
        oldTeam.mark(0, 0);
        newTeam.mark(4, 4);
        const handleJoin = jest.spyOn(room, 'handleJoin');

        room.handleJoinTeam(
            {
                action: 'joinTeam',
                payload: { teamId: newTeam.id },
            },
            auth('alice'),
        );

        for (const connection of [first, second]) {
            const message = boardMessages(connection).at(-1)!;
            expect(message.connectedPlayer?.teamId).toBe(newTeam.id);
            expect(message.board.hidden).toBe(false);
            if (!message.board.hidden) {
                expect(message.board.board).toEqual(newTeam.obfuscateBoard());
                expect(message.board.board[1][0].revealed).toBe(false);
                expect(message.board.board[4][3].revealed).toBe(true);
            }
        }
        expect(handleJoin).not.toHaveBeenCalled();
        expect(room.getPlayerById('alice')!.connections.size).toBe(2);
    });

    it('syncs spectator visibility and the new solo team when participation changes', () => {
        const room = createRoom();
        room.exploration = true;
        room.alwaysRevealedMask = 1n;
        const connection = openSocket();
        room.handleJoin(joinAction('Alice'), auth('alice'), connection);
        room.handleJoin(joinAction('Bob'), auth('bob'), openSocket());
        room.getTeamForPlayer('bob')!.mark(4, 4);
        const player = room.getPlayerById('alice')!;

        room.setPlayerSpectating(player, true);
        const spectating = boardMessages(connection).at(-1)!;
        expect(spectating.connectedPlayer?.teamId).toBeUndefined();
        if (spectating.board.hidden)
            throw new Error('Expected a revealed board');
        expect(spectating.board.board).toEqual(room.spectatorObfuscateBoard());
        expect(spectating.board.board[4][3].revealed).toBe(true);

        room.setPlayerSpectating(player, false);
        const playing = boardMessages(connection).at(-1)!;
        expect(playing.connectedPlayer?.teamId).toBe(player.teamId);
        if (playing.board.hidden) throw new Error('Expected a revealed board');
        expect(playing.board.board).toEqual(player.getBoardView());
        expect(playing.board.board[4][3].revealed).toBe(false);
        const count = boardMessages(connection).length;
        expect(room.setPlayerSpectating(player, false)).toBe(false);
        expect(boardMessages(connection)).toHaveLength(count);
    });

    it('preserves the reveal gate across membership changes, reveals, and resets', () => {
        const room = createRoom(true, true);
        const connection = openSocket();
        room.handleJoin(joinAction('Alice'), auth('alice'), connection);
        room.handleJoin(joinAction('Bob'), auth('bob'), openSocket());
        const player = room.getPlayerById('alice')!;
        room.handleJoinTeam(
            {
                action: 'joinTeam',
                payload: { teamId: room.getTeamForPlayer('bob')!.id },
            },
            auth('alice'),
        );
        expect(boardMessages(connection).at(-1)!.board).toEqual({
            hidden: true,
            width: 5,
            height: 5,
        });

        room.revealCardForPlayer(player);
        room.setPlayerSpectating(player, true);
        expect(boardMessages(connection).at(-1)!.board.hidden).toBe(false);
        const reconnect = room.handleJoin(
            joinAction('Alice'),
            { ...auth('alice'), uuid: 'reconnect' },
            openSocket(),
        );
        expect(reconnect.action).toBe('connected');
        if (reconnect.action !== 'connected')
            throw new Error('Expected connection');
        expect(reconnect.board.hidden).toBe(false);

        room.sendSyncBoard();
        room.setPlayerSpectating(player, false);
        expect(boardMessages(connection).at(-1)!.board).toEqual({
            hidden: true,
            width: 5,
            height: 5,
        });
    });

    it('keeps the full board visible in solo rooms without exploration', () => {
        const room = createRoom();
        const connection = openSocket();
        room.handleJoin(joinAction('Alice'), auth('alice'), connection);
        const player = room.getPlayerById('alice')!;
        room.setPlayerSpectating(player, true);
        room.setPlayerSpectating(player, false);
        const message = boardMessages(connection).at(-1)!;
        expect(message.board.hidden).toBe(false);
        if (!message.board.hidden)
            expect(message.board.board).toEqual(room.board);
    });
    it('preserves other players reveal gates when a membership change disbands a marked team', () => {
        const room = createRoom(true, true);
        const alice = openSocket();
        const bob = openSocket();
        const carol = openSocket();
        room.handleJoin(joinAction('Alice'), auth('alice'), alice);
        room.handleJoin(joinAction('Bob'), auth('bob'), bob);
        room.handleJoin(joinAction('Carol'), auth('carol'), carol);
        room.revealCardForPlayer(room.getPlayerById('alice')!);
        room.revealCardForPlayer(room.getPlayerById('bob')!);
        room.handleMark(
            { action: 'mark', payload: { row: 0, col: 0 } },
            auth('alice'),
        );

        room.setPlayerSpectating(room.getPlayerById('alice')!, true);

        expect(boardMessages(alice).at(-1)!.board.hidden).toBe(false);
        expect(boardMessages(bob).at(-1)!.board.hidden).toBe(false);
        expect(boardMessages(carol).at(-1)!.board.hidden).toBe(true);
    });
});
