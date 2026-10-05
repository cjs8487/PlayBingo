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
import { mock } from 'jest-mock-extended';
import Connection from '../../core/connection/Connection';
import { RoomTokenPayload } from '../../auth/RoomAuth';
import { subscribe, unsubscribe } from '../../core/DatabaseEventListeners';
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
        5,
        5,
        teamsEnabled,
    );
    room.board = Array.from({ length: 5 }, (_, row) =>
        Array.from(
            { length: 5 },
            (_col, col) =>
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
    subscribe(room);
    return room;
};

const auth = (playerId: string, isSpectating = false): RoomTokenPayload => ({
    roomSlug: 'room',
    uuid: `${playerId}-connection`,
    playerId,
    isSpectating,
    isMonitor: true,
});

const socket = () => mock<Connection>();

const joinAction = (nickname: string) =>
    ({ action: 'join', payload: { nickname } }) as JoinAction;

// even a mocked resolved promise defers its continuation to a microtask, and the
// player write is chained behind the team write so the foreign key exists
const flushPersistence = () => new Promise(process.nextTick);

afterEach(async () => {
    unsubscribe('room-id');
    await new Promise<void>((resolve) =>
        jest
            .requireActual<typeof import('timers')>('timers')
            .setImmediate(resolve),
    );
});

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
        const onReveal = jest.fn();
        const onMark = jest.fn();
        room.on('board:revealed', onReveal);
        room.on('board:goalMarked', onMark);
        room.handleStartTimer();
        expect(onReveal).toHaveBeenCalledWith(
            room.getPlayerById('alice'),
            new Date(),
        );

        jest.setSystemTime(new Date(start.getTime() + 65_000));
        room.handleMark(
            { action: 'mark', payload: { row: 0, col: 0 } } as MarkAction,
            auth('alice'),
        );
        expect(onMark).toHaveBeenCalledWith(
            room.board[0][0],
            0,
            0,
            room.getPlayerById('alice'),
            new Date(),
        );
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
        await flushPersistence();
        expect(createUpdateTeam).toHaveBeenCalledWith(
            'room-id',
            expect.objectContaining({
                id: team!.id,
                name: team!.name,
                color: team!.color,
            }),
        );
        expect(createUpdatePlayer).toHaveBeenCalledWith(
            'room-id',
            expect.objectContaining({ id: 'alice', teamId: team?.id }),
        );
        expect(room.getPlayerById('alice')?.getDisplayName()).toBe('Alice');
    });

    it('names the team after the player and announces it when teams are enabled', () => {
        const room = createRoom(true);
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());

        const team = room.getTeamForPlayer('alice')!;
        expect(team.name).toBe("Alice's Team");
        expect(room.getPlayerById('alice')?.getDisplayName()).toBe(
            "Alice (Alice's Team)",
        );
        team.name = 'Renamed Team';
        team.color = 'red';
        const reconnect = room.handleJoin(
            joinAction('Alice'),
            { ...auth('alice'), uuid: 'reconnect' },
            socket(),
        );
        expect(reconnect).toMatchObject({
            chatHistory: [
                expect.objectContaining({
                    action: 'players:join',
                    player: {
                        nickname: 'Alice',
                        teamsEnabled: true,
                        team: { name: "Alice's Team", color: 'blue' },
                    },
                }),
            ],
        });
    });

    it('tracks marks by team ID and applies the team color', async () => {
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
        await flushPersistence();
        expect(createUpdateTeam).toHaveBeenLastCalledWith(
            'room-id',
            expect.objectContaining({
                id: team!.id,
                name: team!.name,
                color: team!.color,
            }),
        );
    });

    it('permits joining another team only when teams are enabled', async () => {
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
        await flushPersistence();
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

    it('attributes team actions to the acting player when teams are enabled', async () => {
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
        await flushPersistence();
        expect(addMarkAction).toHaveBeenCalledWith(
            'room-id',
            'alice',
            team.id,
            1,
            1,
            expect.any(Date),
            expect.objectContaining({
                action: 'board:goalMarked',
                player: {
                    nickname: 'Alice',
                    teamsEnabled: true,
                    team: { name: "Alice's Team", color: 'blue' },
                },
            }),
        );
        expect(room.board[1][1].completedTeams).toContain(team.id);
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
    const openSocket = () => mock<Connection>();

    const boardMessages = (connection: Connection) =>
        (connection.send as jest.Mock).mock.calls
            .map(([raw]) => raw as ServerMessage)
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

    it('keeps a refreshing player on their team instead of creating a new one', () => {
        const room = createRoom(true);
        const aliceSocket = socket();
        room.handleJoin(joinAction('Alice'), auth('alice'), aliceSocket);
        room.handleJoin(joinAction('Bob'), auth('bob'), socket());
        const team = room.getTeamForPlayer('alice')!;
        room.handleJoinTeam(
            {
                action: 'joinTeam',
                payload: { teamId: team.id },
            } as JoinTeamAction,
            auth('bob'),
        );
        room.handleMark(
            { action: 'mark', payload: { row: 0, col: 0 } } as MarkAction,
            auth('alice'),
        );

        // a page refresh drops the old socket, then joins again with the same
        // player id on a new socket
        room.handleSocketClose(aliceSocket);
        expect(room.getPlayerById('alice')?.showInRoom()).toBe(false);
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());

        expect(room.teams.size).toBe(1);
        expect(room.getTeamForPlayer('alice')).toBe(team);
        expect(room.getPlayerById('alice')?.teamId).toBe(team.id);
        expect(team.players.has('bob')).toBe(true);
        expect(room.board[0][0].completedTeams).toEqual([team.id]);
        expect(team.hasMarked(0, 0)).toBe(true);
    });

    it('keeps a refreshing solo player on their team and keeps their marks', () => {
        const room = createRoom(true);
        const aliceSocket = socket();
        room.handleJoin(joinAction('Alice'), auth('alice'), aliceSocket);
        room.handleJoin(joinAction('Bob'), auth('bob'), socket());
        const team = room.getTeamForPlayer('alice')!;
        room.handleMark(
            { action: 'mark', payload: { row: 0, col: 0 } } as MarkAction,
            auth('alice'),
        );

        room.handleSocketClose(aliceSocket);
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());

        expect(room.teams.size).toBe(2);
        expect(room.getTeamForPlayer('alice')).toBe(team);
        expect(room.board[0][0].completedTeams).toEqual([team.id]);
        expect(room.chatHistory).not.toContainEqual([
            chatTimestamp,
            { contents: team.name, color: team.color },
            ` ${team.name} has been disbanded.`,
        ]);
    });

    it('reports team visibility and closes the room once nobody is connected', () => {
        const room = createRoom(true);
        const close = jest.spyOn(room, 'close').mockImplementation(() => {});
        const aliceSocket = socket();
        const bobSocket = socket();
        room.handleJoin(joinAction('Alice'), auth('alice'), aliceSocket);
        room.handleJoin(joinAction('Bob'), auth('bob', true), bobSocket);
        const team = room.getTeamForPlayer('alice')!;

        room.handleSocketClose(aliceSocket);
        expect(team.showInRoom()).toBe(false);
        expect(team.toClientData().showInRoom).toBe(false);
        expect(close).not.toHaveBeenCalled();

        room.handleSocketClose(bobSocket);
        expect(close).toHaveBeenCalledTimes(1);
    });
});

describe('Room handleJoinTeam', () => {
    afterEach(() => jest.clearAllMocks());

    const joinTeam = (teamId: string | null, teamName?: string) =>
        ({
            action: 'joinTeam',
            payload: { teamId, teamName },
        }) as JoinTeamAction;

    // a player must be listed by exactly the team their teamId points to
    const expectOnTeam = (room: Room, playerId: string, teamId: string) => {
        const player = room.getAllPlayers().find((p) => p.id === playerId);
        expect(player).toHaveProperty('teamId', teamId);
        // expect team to have player
        expect(room.teams.get(teamId)!.players.has(playerId)).toBe(true);
        // expect no other team to have player
        room.teams
            .values()
            .filter((t) => t.id != teamId)
            .forEach((team) => expect(team.players.has(playerId)).toBe(false));
    };

    const setup = () => {
        const room = createRoom(true);
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        room.handleJoin(joinAction('Bob'), auth('bob'), socket());
        return {
            room,
            aliceTeam: room.getTeamForPlayer('alice')!,
            bobTeam: room.getTeamForPlayer('bob')!,
        };
    };

    it('moves players between existing and new teams, deleting empty teams', () => {
        const { room, aliceTeam, bobTeam } = setup();
        room.handleJoinTeam(joinTeam(aliceTeam.id), auth('bob'));
        expect(room.teams.has(bobTeam.id)).toBe(false);
        expectOnTeam(room, 'bob', aliceTeam.id);

        const result = room.handleJoinTeam(joinTeam(null, 'New'), auth('bob'));
        expect(result.action).toBe('joinedTeam');
        const newTeam = room.getTeamForPlayer('bob')!;
        expect(newTeam.id).not.toBe(aliceTeam.id);
        expect(newTeam.name).toBe('New');
        expect(room.teams.size).toBe(2);
        expectOnTeam(room, 'alice', aliceTeam.id);
        expectOnTeam(room, 'bob', newTeam.id);
    });

    it('renames the current team without changing membership', () => {
        const { room, aliceTeam } = setup();

        const result = room.handleJoinTeam(
            joinTeam(aliceTeam.id, 'Renamed'),
            auth('alice'),
        );
        expect(result).toEqual({
            action: 'updatedTeam',
            team: aliceTeam.toClientData(),
        });
        expect(aliceTeam.name).toBe('Renamed');
        expect(room.teams.size).toBe(2);
        expectOnTeam(room, 'alice', aliceTeam.id);
    });

    it('rejects unknown teams and players without changing membership', () => {
        const { room, aliceTeam } = setup();

        // team does not exist
        expect(room.handleJoinTeam(joinTeam('missing'), auth('alice'))).toEqual(
            { action: 'unauthorized' },
        );
        // player does not exist
        expect(room.handleJoinTeam(joinTeam(null), auth('nobody'))).toEqual({
            action: 'unauthorized',
        });
        expect(room.teams.size).toBe(2);
        expectOnTeam(room, 'alice', aliceTeam.id);
    });

    it('moves a spectator onto a team', () => {
        const { room, aliceTeam } = setup();
        room.handleJoin(joinAction('Carol'), auth('carol', true), socket());

        room.handleJoinTeam(joinTeam(aliceTeam.id), auth('carol'));
        expect(room.spectators.has('carol')).toBe(false);
        expectOnTeam(room, 'carol', aliceTeam.id);
    });
});
