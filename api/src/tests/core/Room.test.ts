import {
    ChangeColorAction,
    ChatAction,
    JoinAction,
    LeaveAction,
    MarkAction,
    NewCardAction,
    RevealedCell,
    UnmarkAction,
} from '@playbingo/types';
import { mockDeep, mockReset } from 'jest-mock-extended';
import Connection from '../../core/connection/Connection';
import { RoomTokenPayload } from '../../auth/RoomAuth';
import Player from '../../core/Player';
import Room from '../../core/Room';
import { subscribe, unsubscribe } from '../../core/DatabaseEventListeners';
import { joinRoom } from '../../core/RoomServer';
import { createUpdatePlayer } from '../../database/Rooms';
import RaceHandler from '../../core/integration/races/RaceHandler';

jest.mock('../../database/Rooms');

let room: Room;

const mockJoinAction = mockDeep<JoinAction>();
const mockLeaveAction = mockDeep<LeaveAction>();
const mockChatAction = mockDeep<ChatAction>();
mockChatAction.payload = {
    message: 'test message',
};
const mockMarkAction = mockDeep<MarkAction>();
mockMarkAction.payload = {
    row: 3,
    col: 2,
};
const mockUnmarkAction = mockDeep<UnmarkAction>();
mockUnmarkAction.payload = {
    row: 3,
    col: 2,
};

const mockTokenPayload = mockDeep<RoomTokenPayload>();
mockTokenPayload.playerId = 'test';
mockTokenPayload.isSpectating = false;
const mockTokenPayload2 = mockDeep<RoomTokenPayload>();
mockTokenPayload2.playerId = 'test';
const mockTokenPayloadPlayer2 = mockDeep<RoomTokenPayload>();
mockTokenPayloadPlayer2.playerId = 'test2';
mockTokenPayloadPlayer2.isSpectating = false;
const mockTokenPayloadSpectator = mockDeep<RoomTokenPayload>();
mockTokenPayloadSpectator.playerId = 'spectator';
mockTokenPayloadSpectator.isSpectating = true;
const mockSocket = mockDeep<Connection>();
const mockSocket2 = mockDeep<Connection>();

let emitSpy: jest.SpyInstance;
const flushRoomWrites = () =>
    new Promise<void>((resolve) =>
        jest
            .requireActual<typeof import('timers')>('timers')
            .setImmediate(resolve),
    );

beforeEach(() => {
    jest.useFakeTimers();

    room = new Room(
        'Test Room',
        'Test Game',
        'test',
        'test, test',
        '',
        '1',
        false,
        'LINES',
        1,
        false,
        'Normal',
        1,
    );
    room.board = Array.from({ length: 5 }, (_row, row) =>
        Array.from({ length: 5 }, (_col, col): RevealedCell => ({
            revealed: true,
            goal: { id: `${row}-${col}`, goal: 'Test Goal', description: null },
            completedTeams: [],
        })),
    );
    subscribe(room);
    emitSpy = jest.spyOn(room, 'emit');

    mockReset(mockJoinAction);
    mockJoinAction.payload = { nickname: 'Test Player' };
    mockReset(mockTokenPayload);
    mockReset(mockTokenPayload2);
    mockReset(mockTokenPayloadPlayer2);
    mockReset(mockSocket);
    mockReset(mockSocket2);
    mockTokenPayload.uuid = 'connection-1';
    mockTokenPayload2.uuid = 'connection-2';
    mockTokenPayloadPlayer2.uuid = 'connection-3';
});

afterEach(async () => {
    unsubscribe(room.id);
    await flushRoomWrites();
    jest.clearAllMocks();
    jest.useRealTimers();
});

describe('handleJoin', () => {
    it('Creates a new player when a new player joins', async () => {
        joinRoom(room, mockJoinAction, mockTokenPayload, mockSocket);
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBeDefined();
        await flushRoomWrites();
        expect(createUpdatePlayer).toHaveBeenCalled();
        expect(
            room.getPlayerById(mockTokenPayload.playerId)?.connections.size,
        ).toBe(1);
        expect(emitSpy).toHaveBeenCalledTimes(3);
        expect(emitSpy.mock.calls[0][0]).toBe('players:join');
    });

    it('Adds a new connection to an existing player', () => {
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.createTeamForPlayer(player);
        joinRoom(room, mockJoinAction, mockTokenPayload2, mockSocket2);
        expect(
            room.getPlayerById(mockTokenPayload.playerId)?.connections.size,
        ).toBe(2);
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBeDefined();
        expect(room.getAllPlayers().length).toBe(1);
        expect(emitSpy).toHaveBeenCalledWith(
            'player:connected',
            player,
            false,
            new Date(),
        );
    });

    it('Creates two new players when two new players join', async () => {
        joinRoom(room, mockJoinAction, mockTokenPayload, mockSocket);
        expect(emitSpy).toHaveBeenCalledTimes(3);
        expect(emitSpy.mock.calls[0][0]).toBe('players:join');
        joinRoom(room, mockJoinAction, mockTokenPayloadPlayer2, mockSocket2);
        expect(emitSpy).toHaveBeenCalledTimes(6);
        expect(emitSpy.mock.calls[3][0]).toBe('players:join');
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBeDefined();
        expect(
            room.getPlayerById(mockTokenPayloadPlayer2.playerId),
        ).toBeDefined();
        expect(room.getAllPlayers().length).toBe(2);
        expect(
            room.getPlayerById(mockTokenPayload.playerId)?.connections.size,
        ).toBe(1);
        expect(
            room.getPlayerById(mockTokenPayloadPlayer2.playerId)?.connections
                .size,
        ).toBe(1);
        await flushRoomWrites();
        expect(createUpdatePlayer).toHaveBeenCalledTimes(2);
    });

    it('Emits join events for new players', () => {
        const onJoin = jest.fn();
        room.on('players:join', onJoin);
        mockJoinAction.payload = { nickname: 'player 1' };
        joinRoom(room, mockJoinAction, mockTokenPayload, mockSocket);
        mockJoinAction.payload = { nickname: 'player 2' };
        joinRoom(room, mockJoinAction, mockTokenPayloadPlayer2, mockSocket2);
        expect(onJoin).toHaveBeenCalledTimes(2);
        expect(onJoin).toHaveBeenCalledWith(
            room.getPlayerById(mockTokenPayload.playerId),
            new Date(),
        );
        expect(onJoin).toHaveBeenCalledWith(
            room.getPlayerById(mockTokenPayloadPlayer2.playerId),
            new Date(),
        );
    });

    it('Emits a join event for a new spectator', () => {
        const onJoin = jest.fn();
        room.on('players:join', onJoin);
        mockJoinAction.payload = { nickname: 'spectator' };
        joinRoom(room, mockJoinAction, mockTokenPayloadSpectator, mockSocket);
        expect(onJoin).toHaveBeenCalledWith(
            room.spectators.get(mockTokenPayloadSpectator.playerId),
            new Date(),
        );
    });

    it('Does not emit a join event when an existing player reconnects', () => {
        const onJoin = jest.fn();
        room.on('players:join', onJoin);
        joinRoom(room, mockJoinAction, mockTokenPayload, mockSocket);
        joinRoom(room, mockJoinAction, mockTokenPayload2, mockSocket2);
        expect(onJoin).toHaveBeenCalledTimes(1);
    });
});

describe('handleLeave', () => {
    it('Removes a player from the room if it is their last connection', () => {
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.createTeamForPlayer(player);
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBeDefined();
        jest.spyOn(room, 'close').mockImplementation(() => {});
        room.handleLeave(mockLeaveAction, mockTokenPayload, 'test');
        expect(player.connections.size).toBe(0);
        expect(player.showInRoom()).toBe(false);
        expect(emitSpy).toHaveBeenCalledWith(
            'players:leave',
            player,
            new Date(),
        );
    });

    it('Removes the connection from the player if it is not their last one', () => {
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        player.addConnection(mockTokenPayload2.uuid, mockSocket);
        room.createTeamForPlayer(player);
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBeDefined();
        room.handleLeave(mockLeaveAction, mockTokenPayload2, 'test');
        expect(player.connections.size).toBe(1);
        expect(player.showInRoom()).toBe(true);
        expect(emitSpy).not.toHaveBeenCalled();
    });
    // TODO: POST REFACTOR CHECK FOR UNAUTHORIZED RESPONSE SINCE THE RETURN TYPE
    // OF ACTION HANDLERS WILL LIKELY CHANGE
});

describe('handleChat', () => {
    it('Sends a chat message to all players', () => {
        const player = new Player(room, 'test', 'Test Player', false);
        room.createTeamForPlayer(player);
        room.handleChat(mockChatAction, mockTokenPayload);
        expect(room.chatHistory).toContainEqual(
            expect.objectContaining({
                action: 'player:chat',
                player: expect.objectContaining({ nickname: player.nickname }),
                message: 'test message',
            }),
        );
        expect(emitSpy).toHaveBeenCalledWith(
            'player:chat',
            player,
            'test message',
            new Date(),
        );
    });
    // TODO: TEST UNAUTHORIZED
});

describe('Board Control', () => {
    beforeEach(() => {
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.createTeamForPlayer(player);

        const player2 = new Player(room, 'test2', 'Test Player', false);
        player2.addConnection(mockTokenPayloadPlayer2.uuid, mockSocket2);
        room.createTeamForPlayer(player2);

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                room.board[i][j].completedTeams = [];
            }
        }
    });

    describe('Marking', () => {
        it('Marks the correct cell if unmarked', () => {
            room.handleMark(mockMarkAction, mockTokenPayload);
            const completedTeams =
                room.board[mockMarkAction.payload.row][
                    mockMarkAction.payload.col
                ].completedTeams;
            expect(completedTeams.length).toBe(1);
            expect(completedTeams).toContain(
                room.getTeamForPlayer(mockTokenPayload.playerId)!.id,
            );
            expect(emitSpy).toHaveBeenCalledTimes(2);
            expect(emitSpy.mock.calls[0][0]).toBe('board:goalMarked');
            room.handleMark(mockMarkAction, mockTokenPayloadPlayer2);
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    const cell = room.board[i][j];
                    if (
                        i === mockMarkAction.payload.row &&
                        j === mockMarkAction.payload.col
                    ) {
                        expect(cell.completedTeams.length).toBe(2);
                        expect(cell.completedTeams).toContain(
                            room.getTeamForPlayer(mockTokenPayload.playerId)!
                                .id,
                        );
                        expect(cell.completedTeams).toContain(
                            room.getTeamForPlayer(
                                mockTokenPayloadPlayer2.playerId,
                            )!.id,
                        );
                    } else {
                        expect(cell.completedTeams.length).toBe(0);
                    }
                }
            }
            expect(emitSpy).toHaveBeenCalledTimes(4);
            expect(emitSpy.mock.calls[2][0]).toBe('board:goalMarked');
        });

        it('Sends a cell message update', () => {
            room.handleMark(mockMarkAction, mockTokenPayload);
            expect(emitSpy).toHaveBeenCalledTimes(2);
            expect(emitSpy.mock.calls[0][0]).toBe('board:goalMarked');
        });

        it('Sends a cell update to connected players', () => {
            const player = room.getPlayerById(mockTokenPayload.playerId)!;
            const otherPlayer = room.getPlayerById(
                mockTokenPayloadPlayer2.playerId,
            )!;
            const sendPlayer = jest.spyOn(player, 'sendMessage');
            const sendOtherPlayer = jest.spyOn(otherPlayer, 'sendMessage');
            const { row, col } = mockMarkAction.payload;

            room.handleMark(mockMarkAction, mockTokenPayload);

            const message = {
                action: 'board:cellUpdate',
                timestamp: new Date().toISOString(),
                row,
                col,
                cell: room.board[row][col],
                players: room.getPlayerData(),
            };
            expect(sendPlayer).toHaveBeenCalledWith(message);
            expect(sendOtherPlayer).toHaveBeenCalledWith(message);
        });

        it('Emits the mark event with the acting player', () => {
            const player = room.getPlayerById(mockTokenPayload.playerId)!;
            const { row, col } = mockMarkAction.payload;
            const onGoalChange = jest.fn();
            room.on('board:goalMarked', onGoalChange);

            room.handleMark(mockMarkAction, mockTokenPayload);

            expect(onGoalChange).toHaveBeenCalledWith(
                room.board[row][col],
                row,
                col,
                player,
                new Date(),
            );
        });
        // TODO: TEST UNAUTHORIZED
    });

    describe('Unmarking', () => {
        beforeEach(() => {
            room.board[mockMarkAction.payload.row][
                mockMarkAction.payload.col
            ].completedTeams = [
                room.getTeamForPlayer(mockTokenPayload.playerId)!.id,
            ];
            room.getTeamForPlayer(mockTokenPayload.playerId)!.mark(
                mockMarkAction.payload.row,
                mockMarkAction.payload.col,
            );
        });

        it('Unmarks the correct cell if it is marked', () => {
            room.handleUnmark(mockUnmarkAction, mockTokenPayload);
            const completedTeams =
                room.board[mockMarkAction.payload.row][
                    mockMarkAction.payload.col
                ].completedTeams;
            expect(completedTeams.length).toBe(0);
        });

        it('Sends a cell message update', () => {
            room.handleUnmark(mockUnmarkAction, mockTokenPayload);
            expect(emitSpy).toHaveBeenCalledTimes(2);
            expect(emitSpy.mock.calls[0][0]).toBe('board:goalUnmarked');
        });

        it('Sends a cell update to connected players', () => {
            const player = room.getPlayerById(mockTokenPayload.playerId)!;
            const otherPlayer = room.getPlayerById(
                mockTokenPayloadPlayer2.playerId,
            )!;
            const sendPlayer = jest.spyOn(player, 'sendMessage');
            const sendOtherPlayer = jest.spyOn(otherPlayer, 'sendMessage');
            const { row, col } = mockUnmarkAction.payload;

            room.handleUnmark(mockUnmarkAction, mockTokenPayload);

            const message = {
                action: 'board:cellUpdate',
                timestamp: new Date().toISOString(),
                row,
                col,
                cell: room.board[row][col],
                players: room.getPlayerData(),
            };
            expect(sendPlayer).toHaveBeenCalledWith(message);
            expect(sendOtherPlayer).toHaveBeenCalledWith(message);
        });

        it('Emits the unmark event with the acting player', () => {
            const player = room.getPlayerById(mockTokenPayload.playerId)!;
            const { row, col } = mockUnmarkAction.payload;
            const onGoalChange = jest.fn();
            room.on('board:goalUnmarked', onGoalChange);

            room.handleUnmark(mockUnmarkAction, mockTokenPayload);

            expect(onGoalChange).toHaveBeenCalledWith(
                room.board[row][col],
                row,
                col,
                player,
                new Date(),
            );
        });
        // TODO: TEST UNAUTHORIZED
    });
});

describe('handleChangeColor', () => {
    beforeEach(() => {
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.createTeamForPlayer(player);
    });

    it('Changes team color and emits the change', () => {
        const mockChangeColorAction = mockDeep<ChangeColorAction>();
        mockChangeColorAction.payload = { color: 'red' };

        room.handleChangeColor(mockChangeColorAction, mockTokenPayload);

        const player = room.getPlayerById(mockTokenPayload.playerId)!;
        expect(room.getTeamForPlayer(player.id)!.color).toBe('red');
        expect(emitSpy).toHaveBeenCalledWith(
            'player:colorChanged',
            player,
            'red',
            'blue',
            new Date(),
        );
        expect(emitSpy).toHaveBeenCalledTimes(2);
        expect(emitSpy.mock.calls[0][0]).toBe('player:colorChanged');
    });

    it('Returns unauthorized for non-existent player', () => {
        const mockChangeColorAction = mockDeep<ChangeColorAction>();
        mockChangeColorAction.payload = { color: 'red' };

        const result = room.handleChangeColor(mockChangeColorAction, {
            ...mockTokenPayload,
            playerId: 'nonexistent',
        });

        expect(result).toEqual({ action: 'unauthorized' });
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('Does nothing if no color provided', () => {
        const mockChangeColorAction = mockDeep<ChangeColorAction>();
        mockChangeColorAction.payload = {
            color: undefined as unknown as ChangeColorAction['payload']['color'],
        };

        const result = room.handleChangeColor(
            mockChangeColorAction,
            mockTokenPayload,
        );

        expect(result).toBeUndefined();
        expect(room.chatHistory).toHaveLength(0);
        expect(emitSpy).not.toHaveBeenCalled();
    });
});

describe('handleNewCard', () => {
    beforeEach(() => {
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.createTeamForPlayer(player);
    });

    it('Generates new board with default options', async () => {
        const generateBoardSpy = jest
            .spyOn(room, 'generateBoard')
            .mockResolvedValue(undefined);
        const mockNewCardAction = mockDeep<NewCardAction>();
        mockNewCardAction.options = undefined;

        await room.handleNewCard(mockNewCardAction);
        expect(emitSpy).not.toHaveBeenCalled();

        expect(generateBoardSpy).toHaveBeenCalledWith({ mode: 'Random' });
    });

    it('Generates new board with provided options', async () => {
        const generateBoardSpy = jest
            .spyOn(room, 'generateBoard')
            .mockResolvedValue(undefined);
        const mockNewCardAction = mockDeep<NewCardAction>();
        mockNewCardAction.options = {
            mode: 'SRLv5',
            seed: 12345,
        };

        await room.handleNewCard(mockNewCardAction);
        expect(emitSpy).not.toHaveBeenCalled();

        expect(generateBoardSpy).toHaveBeenCalledWith({
            mode: 'SRLv5',
            seed: 12345,
        });
    });
});

describe('readyPlayer and unreadyPlayer', () => {
    beforeEach(() => {
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.createTeamForPlayer(player);
    });

    it('Readies player successfully', () => {
        const player = room.getPlayerById(mockTokenPayload.playerId)!;
        const readySpy = jest.spyOn(player, 'ready');

        const result = room.readyPlayer(mockTokenPayload);

        expect(readySpy).toHaveBeenCalled();
        expect(result).toBeInstanceOf(Promise);
    });

    it('Returns false for non-existent player when readying', () => {
        const result = room.readyPlayer({
            ...mockTokenPayload,
            playerId: 'nonexistent',
        });

        expect(result).toBe(false);
    });

    it('Unreadies player successfully', () => {
        const player = room.getPlayerById(mockTokenPayload.playerId)!;
        const unreadySpy = jest.spyOn(player, 'unready');

        const result = room.unreadyPlayer(mockTokenPayload);

        expect(unreadySpy).toHaveBeenCalled();
        expect(result).toBeInstanceOf(Promise);
    });

    it('Returns false for non-existent player when unreadying', () => {
        const result = room.unreadyPlayer({
            ...mockTokenPayload,
            playerId: 'nonexistent',
        });

        expect(result).toBe(false);
    });
});

describe('room state events', () => {
    it('emits timer events after the timer state changes', () => {
        let startedAt: string | undefined;
        const raceHandler = mockDeep<RaceHandler>();
        raceHandler.startTimer.mockImplementation(() => {
            startedAt = '2024-01-02T03:04:05.000Z';
        });
        raceHandler.resetTimer.mockImplementation(() => {
            startedAt = undefined;
        });
        raceHandler.getStartTime.mockImplementation(() => startedAt);
        room.raceHandler = raceHandler;

        room.handleStartTimer();
        expect(emitSpy).toHaveBeenCalledWith(
            'timer:started',
            new Date(startedAt!),
        );
        expect(room.roomData.startedAt).toBe('2024-01-02T03:04:05.000Z');

        room.handleResetTimer();
        expect(emitSpy).toHaveBeenCalledWith('timer:reset');
        expect(room.roomData.startedAt).toBeUndefined();
    });

    it.each(['LINES', 'BLACKOUT', 'LOCKOUT'] as const)(
        'emits finish and unfinish events for %s',
        (mode) => {
            room.bingoMode = mode;
            room.board = [[mockDeep<RevealedCell>()]];
            room.board[0][0].completedTeams = [];
            room.victoryMasks = [1n];
            room.boardWidth = 1;
            room.boardHeight = 1;
            const player = new Player(room, 'test', 'Test Player', false);
            const team = room.createTeamForPlayer(player);

            const finishedAt = '2024-01-02T03:04:05.000Z';
            let endedAt: string | undefined;
            const raceHandler = mockDeep<RaceHandler>();
            raceHandler.playerFinished.mockImplementation(async (finished) => {
                finished.finishedAt = finishedAt;
            });
            raceHandler.playerUnfinshed.mockImplementation(async (finished) => {
                finished.finishedAt = undefined;
            });
            raceHandler.allPlayersFinished.mockImplementation(async () => {
                endedAt = finishedAt;
            });
            raceHandler.allPlayersNotFinished.mockImplementation(async () => {
                endedAt = undefined;
            });
            raceHandler.getEndTime.mockImplementation(() => endedAt);
            room.raceHandler = raceHandler;

            room.handleMark(
                { payload: { row: 0, col: 0 } } as MarkAction,
                mockTokenPayload,
            );

            expect(team.goalComplete).toBe(true);
            expect(emitSpy).toHaveBeenCalledWith(
                'team:finished',
                team,
                new Date(),
            );
            expect(emitSpy).toHaveBeenCalledWith(
                'timer:stopped',
                new Date(finishedAt),
            );
            expect(room.roomData.finishedAt).toBe(finishedAt);

            room.handleUnmark(
                { payload: { row: 0, col: 0 } } as UnmarkAction,
                mockTokenPayload,
            );

            expect(team.goalComplete).toBe(false);
            expect(emitSpy).toHaveBeenCalledWith(
                'team:unfinished',
                team,
                new Date(),
            );
        },
    );
});
