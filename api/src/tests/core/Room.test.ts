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
import { RoomTokenPayload } from '../../auth/RoomAuth';
import PlayBingoSocket from '../../core/connection/PlayBingoSocket';
import RaceHandler from '../../core/integration/races/RaceHandler';
import Player from '../../core/Player';
import Room from '../../core/Room';

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
const mockSocket = mockDeep<PlayBingoSocket>();
const mockSocket2 = mockDeep<PlayBingoSocket>();

let emitSpy: jest.SpyInstance;

beforeEach(() => {
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
    room.board = mockDeep<RevealedCell[][]>();
    emitSpy = jest.spyOn(room, 'emit');

    mockReset(mockJoinAction);
    mockReset(mockTokenPayload);
    mockReset(mockTokenPayload2);
    mockReset(mockTokenPayloadPlayer2);
    mockReset(mockSocket);
    mockReset(mockSocket2);

    jest.useFakeTimers();
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('handleJoin', () => {
    it('Creates a new player when a new player joins', () => {
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        expect(room.players.has(mockTokenPayload.playerId)).toBe(true);
        expect(
            room.players.get(mockTokenPayload.playerId)?.connections.size,
        ).toBe(1);
        expect(emitSpy).toHaveBeenCalledWith(
            'players:join',
            expect.any(Player),
        );
    });

    it('Adds a new connection to an existing player', () => {
        const player = new Player(
            room,
            'test',
            'Test Player',
            'blue',
            false,
            false,
        );
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.players.set(mockTokenPayload.playerId, player);
        room.handleJoin(mockJoinAction, mockTokenPayload2, mockSocket2);
        expect(
            room.players.get(mockTokenPayload.playerId)?.connections.size,
        ).toBe(2);
        expect(room.players.has(mockTokenPayload.playerId)).toBe(true);
        expect(room.players.size).toBe(1);
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('Creates two new players when two new players join', () => {
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        expect(emitSpy).toHaveBeenCalledWith(
            'players:join',
            expect.any(Player),
        );
        room.handleJoin(mockJoinAction, mockTokenPayloadPlayer2, mockSocket2);
        expect(emitSpy).toHaveBeenCalledWith(
            'players:join',
            expect.any(Player),
        );
        expect(room.players.has(mockTokenPayload.playerId)).toBe(true);
        expect(room.players.has(mockTokenPayloadPlayer2.playerId)).toBe(true);
        expect(room.players.size).toBe(2);
        expect(
            room.players.get(mockTokenPayload.playerId)?.connections.size,
        ).toBe(1);
        expect(
            room.players.get(mockTokenPayloadPlayer2.playerId)?.connections
                .size,
        ).toBe(1);
    });

    it('Does not send join message for existing players', () => {
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        room.handleJoin(mockJoinAction, mockTokenPayload2, mockSocket2);
        expect(emitSpy).toHaveBeenCalledTimes(1);
    });
});

describe('handleLeave', () => {
    it('Removes a player from the room if it is their last connection', () => {
        const player = new Player(
            room,
            'test',
            'Test Player',
            'blue',
            false,
            false,
        );
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.players.set(mockTokenPayload.playerId, player);
        expect(room.players.has(mockTokenPayload.playerId)).toBe(true);
        room.handleLeave(mockLeaveAction, mockTokenPayload, 'test');
        expect(player.connections.size).toBe(0);
        expect(player.showInRoom()).toBe(false);
    });

    it('Removes the connection from the player if it is not their last one', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        const player = new Player(
            room,
            'test',
            'Test Player',
            'blue',
            false,
            false,
        );
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        player.addConnection(mockTokenPayload2.uuid, mockSocket);
        room.players.set(mockTokenPayload.playerId, player);
        expect(room.players.has(mockTokenPayload.playerId)).toBe(true);
        room.handleLeave(mockLeaveAction, mockTokenPayload2, 'test');
        expect(player.connections.size).toBe(1);
        expect(player.showInRoom()).toBe(true);
        expect(emitSpy).not.toHaveBeenCalled();
        expect(sendChatSpy).not.toHaveBeenCalled();
    });
    // TODO: POST REFACTOR CHECK FOR UNAUTHORIZED RESPONSE SINCE THE RETURN TYPE
    // OF ACTION HANDLERS WILL LIKELY CHANGE
});

describe('handleChat', () => {
    it('Sends a chat message to all players', () => {
        const player = new Player(
            room,
            'test',
            'Test Player',
            'blue',
            false,
            false,
        );
        room.players.set(mockTokenPayload.playerId, player);
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        room.handleChat(mockChatAction, mockTokenPayload);
        expect(sendChatSpy).toHaveBeenCalledTimes(1);
        expect(sendChatSpy).toHaveBeenCalledWith(
            `${player.nickname}: test message`,
            new Date(),
        );
        expect(emitSpy).toHaveBeenCalledWith('chatSent', expect.any(Array));
    });
    // TODO: TEST UNAUTHORIZED
});

describe('Board Control', () => {
    beforeEach(() => {
        const player = new Player(
            room,
            'test',
            'Test Player',
            'blue',
            false,
            false,
        );
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.players.set(mockTokenPayload.playerId, player);

        const player2 = new Player(
            room,
            'test2',
            'Test Player',
            'blue',
            false,
            false,
        );
        player2.addConnection(mockTokenPayloadPlayer2.uuid, mockSocket2);
        room.players.set(mockTokenPayloadPlayer2.playerId, player2);

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                room.board[i][j].completedPlayers = [];
            }
        }
    });

    describe('Marking', () => {
        it('Marks the correct cell if unmarked', () => {
            room.handleMark(mockMarkAction, mockTokenPayload);
            let completedPlayers =
                room.board[mockMarkAction.payload.row][
                    mockMarkAction.payload.col
                ].completedPlayers;
            expect(completedPlayers.length).toBe(1);
            expect(completedPlayers).toContain(mockTokenPayload.playerId);
            expect(emitSpy).toHaveBeenCalledWith(
                'board:goalMarked',
                room.board[mockMarkAction.payload.row][
                    mockMarkAction.payload.col
                ],
                mockMarkAction.payload.row,
                mockMarkAction.payload.col,
                room.players.get(mockTokenPayload.playerId),
            );
            room.handleMark(mockMarkAction, mockTokenPayloadPlayer2);
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    const cell = room.board[i][j];
                    if (
                        i === mockMarkAction.payload.row &&
                        j === mockMarkAction.payload.col
                    ) {
                        expect(cell.completedPlayers.length).toBe(2);
                        expect(cell.completedPlayers).toContain(
                            mockTokenPayload.playerId,
                        );
                        expect(cell.completedPlayers).toContain(
                            mockTokenPayloadPlayer2.playerId,
                        );
                    } else {
                        expect(cell.completedPlayers.length).toBe(0);
                    }
                }
            }
            expect(emitSpy).toHaveBeenCalledTimes(2);
            expect(emitSpy.mock.calls[1][0]).toBe('board:goalMarked');
        });

        it('Sends a cell message update', () => {
            room.handleMark(mockMarkAction, mockTokenPayload);
            expect(emitSpy).toHaveBeenCalledWith(
                'board:goalMarked',
                room.board[mockMarkAction.payload.row][
                    mockMarkAction.payload.col
                ],
                mockMarkAction.payload.row,
                mockMarkAction.payload.col,
                room.players.get(mockTokenPayload.playerId),
            );
        });

        // TODO: TEST UNAUTHORIZED
    });

    describe('Unmarking', () => {
        beforeEach(() => {
            room.board[mockMarkAction.payload.row][
                mockMarkAction.payload.col
            ].completedPlayers = [mockTokenPayload.playerId];
            room.players
                .get(mockTokenPayload.playerId)
                ?.mark(mockMarkAction.payload.row, mockMarkAction.payload.col);
        });

        it('Unmarks the correct cell if it is marked', () => {
            room.handleUnmark(mockUnmarkAction, mockTokenPayload);
            let completedPlayers =
                room.board[mockMarkAction.payload.row][
                    mockMarkAction.payload.col
                ].completedPlayers;
            expect(completedPlayers.length).toBe(0);
        });

        it('Sends a cell message update', () => {
            room.handleUnmark(mockUnmarkAction, mockTokenPayload);
            expect(emitSpy).toHaveBeenCalledWith(
                'board:goalUnmarked',
                room.board[mockUnmarkAction.payload.row][
                    mockUnmarkAction.payload.col
                ],
                mockUnmarkAction.payload.row,
                mockUnmarkAction.payload.col,
                room.players.get(mockTokenPayload.playerId),
            );
        });

        // TODO: TEST UNAUTHORIZED
    });
});

describe('handleChangeColor', () => {
    beforeEach(() => {
        const player = new Player(
            room,
            'test',
            'Test Player',
            'blue',
            false,
            false,
        );
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.players.set(mockTokenPayload.playerId, player);
    });

    it('Changes player color and sends chat message', () => {
        const mockChangeColorAction = mockDeep<ChangeColorAction>();
        mockChangeColorAction.payload = { color: 'red' };

        room.handleChangeColor(mockChangeColorAction, mockTokenPayload);

        const player = room.players.get(mockTokenPayload.playerId)!;
        expect(player.color).toBe('red');
        expect(emitSpy).toHaveBeenCalledWith(
            'player:colorChanged',
            player,
            'red',
        );
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
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        const mockChangeColorAction = mockDeep<ChangeColorAction>();
        mockChangeColorAction.payload = { color: undefined as any };

        const result = room.handleChangeColor(
            mockChangeColorAction,
            mockTokenPayload,
        );

        expect(result).toBeUndefined();
        expect(sendChatSpy).not.toHaveBeenCalled();
        expect(emitSpy).not.toHaveBeenCalled();
    });
});

describe('handleNewCard', () => {
    beforeEach(() => {
        const player = new Player(
            room,
            'test',
            'Test Player',
            'blue',
            false,
            false,
        );
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.players.set(mockTokenPayload.playerId, player);
    });

    it('Generates new board with default options', () => {
        const generateBoardSpy = jest.spyOn(room, 'generateBoard');
        const mockNewCardAction = mockDeep<NewCardAction>();
        mockNewCardAction.options = undefined;

        room.handleNewCard(mockNewCardAction);

        expect(generateBoardSpy).toHaveBeenCalledWith({ mode: 'Random' });
    });

    it('Generates new board with provided options', () => {
        const generateBoardSpy = jest.spyOn(room, 'generateBoard');
        const mockNewCardAction = mockDeep<NewCardAction>();
        mockNewCardAction.options = {
            mode: 'SRLv5',
            seed: 12345,
        };

        room.handleNewCard(mockNewCardAction);

        expect(generateBoardSpy).toHaveBeenCalledWith({
            mode: 'SRLv5',
            seed: 12345,
        });
    });
});

describe('readyPlayer and unreadyPlayer', () => {
    beforeEach(() => {
        const player = new Player(
            room,
            'test',
            'Test Player',
            'blue',
            false,
            false,
        );
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.players.set(mockTokenPayload.playerId, player);
    });

    it('Readies player successfully', () => {
        const player = room.players.get(mockTokenPayload.playerId)!;
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
        const player = room.players.get(mockTokenPayload.playerId)!;
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
            room.board[0][0].completedPlayers = [];
            room.victoryMasks = [1n];
            const player = new Player(
                room,
                'test',
                'Test Player',
                'blue',
                false,
                false,
            );
            room.players.set(player.id, player);

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

            const chatSpy = jest.spyOn(room, 'sendChat');
            chatSpy.mockClear();
            room.handleMark(
                { payload: { row: 0, col: 0 } } as MarkAction,
                mockTokenPayload,
            );

            expect(player.goalComplete).toBe(true);
            expect(emitSpy).toHaveBeenCalledWith(
                'player:finished',
                player,
                new Date(finishedAt),
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

            expect(player.goalComplete).toBe(false);
            expect(emitSpy).toHaveBeenCalledWith('player:unfinished', player);
            expect(chatSpy).not.toHaveBeenCalled();
        },
    );
});
