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
import { PlayBingoSocketLike } from '../../core/PlayBingoSocket';
import { RoomTokenPayload } from '../../auth/RoomAuth';
import Player from '../../core/Player';
import Room from '../../core/Room';
import { subscribe, unsubscribe } from '../../core/DatabaseEventListeners';
import { createUpdatePlayer } from '../../database/Rooms';

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
const mockSocket = mockDeep<PlayBingoSocketLike>();
const mockSocket2 = mockDeep<PlayBingoSocketLike>();

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
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
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
        room.handleJoin(mockJoinAction, mockTokenPayload2, mockSocket2);
        expect(
            room.getPlayerById(mockTokenPayload.playerId)?.connections.size,
        ).toBe(2);
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBeDefined();
        expect(room.getAllPlayers().length).toBe(1);
        expect(emitSpy).toHaveBeenCalledWith(
            'player:connected',
            player,
            new Date(),
        );
    });

    it('Creates two new players when two new players join', async () => {
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        expect(emitSpy).toHaveBeenCalledTimes(3);
        expect(emitSpy.mock.calls[0][0]).toBe('players:join');
        room.handleJoin(mockJoinAction, mockTokenPayloadPlayer2, mockSocket2);
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

    it('Sends join message for new players', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        mockJoinAction.payload = { nickname: 'player 1' };
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        mockJoinAction.payload = { nickname: 'player 2' };
        room.handleJoin(mockJoinAction, mockTokenPayloadPlayer2, mockSocket2);
        expect(sendChatSpy).toHaveBeenCalledTimes(2);
        expect(sendChatSpy).toHaveBeenCalledWith(
            [
                '[0:00:00] ',
                { contents: 'player 1', color: 'blue' },
                ' has joined.',
            ],
            new Date(),
        );
        expect(sendChatSpy).toHaveBeenCalledWith(
            [
                '[0:00:00] ',
                { contents: 'player 2', color: 'blue' },
                ' has joined.',
            ],
            new Date(),
        );
    });

    it('Sends spectator join message for new spectators', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        mockJoinAction.payload = { nickname: 'spectator' };
        room.handleJoin(mockJoinAction, mockTokenPayloadSpectator, mockSocket);
        expect(sendChatSpy).toHaveBeenCalledTimes(1);
        expect(sendChatSpy).toHaveBeenCalledWith(
            'spectator is now spectating',
            new Date(),
        );
    });

    it('Does not send join message for existing players', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        room.handleJoin(mockJoinAction, mockTokenPayload2, mockSocket2);
        expect(sendChatSpy).toHaveBeenCalledTimes(1);
    });
});

describe('handleLeave', () => {
    it('Removes a player from the room if it is their last connection', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.createTeamForPlayer(player);
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBeDefined();
        jest.spyOn(room, 'close').mockImplementation(() => {});
        room.handleLeave(mockLeaveAction, mockTokenPayload, 'test');
        expect(player.connections.size).toBe(0);
        expect(player.showInRoom()).toBe(false);
        expect(sendChatSpy).toHaveBeenCalledTimes(1);
        expect(sendChatSpy).toHaveBeenCalledWith(
            [
                '[0:00:00] ',
                { contents: 'Test Player', color: 'blue' },
                ' has left.',
            ],
            new Date(),
        );
    });

    it('Removes the connection from the player if it is not their last one', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        player.addConnection(mockTokenPayload2.uuid, mockSocket);
        room.createTeamForPlayer(player);
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBeDefined();
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
        const player = new Player(room, 'test', 'Test Player', false);
        room.createTeamForPlayer(player);
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        room.handleChat(mockChatAction, mockTokenPayload);
        expect(sendChatSpy).toHaveBeenCalledTimes(1);
        expect(sendChatSpy).toHaveBeenCalledWith(
            `${player.nickname}: test message`,
            new Date(),
        );
        expect(emitSpy).toHaveBeenCalledTimes(2);
        expect(emitSpy.mock.calls[0][0]).toBe('chatSent');
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

        it('Sends a chat message', () => {
            const sendChatSpy = jest.spyOn(room, 'sendChat');
            const player = room.getPlayerById(mockTokenPayload.playerId)!;
            const { row, col } = mockMarkAction.payload;
            room.handleMark(mockMarkAction, mockTokenPayload);
            expect(sendChatSpy).toHaveBeenCalledTimes(1);
            expect(sendChatSpy).toHaveBeenCalledWith(
                [
                    '[0:00:00] ',
                    {
                        contents: player.nickname,
                        color: room.getTeamForPlayer(player.id)!.color,
                    },
                    ` marked ${room.board[row][col].goal.goal} (${row},${col})`,
                ],
                new Date(),
            );
            expect(emitSpy).toHaveBeenCalledTimes(2);
            expect(emitSpy.mock.calls[1][0]).toBe('chatSent');
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

        it('Sends a chat message', () => {
            const sendChatSpy = jest.spyOn(room, 'sendChat');
            const player = room.getPlayerById(mockTokenPayload.playerId)!;
            const { row, col } = mockMarkAction.payload;
            room.handleUnmark(mockUnmarkAction, mockTokenPayload);
            expect(sendChatSpy).toHaveBeenCalledTimes(1);
            expect(sendChatSpy).toHaveBeenCalledWith(
                [
                    '[0:00:00] ',
                    {
                        contents: player.nickname,
                        color: room.getTeamForPlayer(player.id)!.color,
                    },
                    ` unmarked ${room.board[row][col].goal.goal} (${row},${col})`,
                ],
                new Date(),
            );
            expect(emitSpy).toHaveBeenCalledTimes(2);
            expect(emitSpy.mock.calls[1][0]).toBe('chatSent');
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

    it('Changes player color and sends chat message', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        const mockChangeColorAction = mockDeep<ChangeColorAction>();
        mockChangeColorAction.payload = { color: 'red' };

        room.handleChangeColor(mockChangeColorAction, mockTokenPayload);

        const player = room.getPlayerById(mockTokenPayload.playerId)!;
        expect(room.getTeamForPlayer(player.id)!.color).toBe('red');
        expect(sendChatSpy).toHaveBeenCalledWith(
            [
                '[0:00:00] ',
                { contents: 'Test Player', color: 'red' },
                ' has changed their color to ',
                { contents: 'red', color: 'red' },
            ],
            new Date(),
        );
        expect(emitSpy).toHaveBeenCalledWith(
            'player:colorChanged',
            player,
            'red',
            'blue',
            new Date(),
        );
        expect(emitSpy).toHaveBeenCalledTimes(2);
        expect(emitSpy.mock.calls[0][0]).toBe('player:colorChanged');
        expect(emitSpy.mock.calls[1][0]).toBe('chatSent');
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
        mockChangeColorAction.payload = {
            color: undefined as unknown as ChangeColorAction['payload']['color'],
        };

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
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        room.createTeamForPlayer(player);
    });

    it('Generates new board with default options', () => {
        const generateBoardSpy = jest
            .spyOn(room, 'generateBoard')
            .mockResolvedValue(undefined);
        const mockNewCardAction = mockDeep<NewCardAction>();
        mockNewCardAction.options = undefined;

        room.handleNewCard(mockNewCardAction);

        expect(generateBoardSpy).toHaveBeenCalledWith({ mode: 'Random' });
        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(emitSpy.mock.calls[0][0]).toBe('board:regenerated');
    });

    it('Generates new board with provided options', () => {
        const generateBoardSpy = jest
            .spyOn(room, 'generateBoard')
            .mockResolvedValue(undefined);
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
        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(emitSpy.mock.calls[0][0]).toBe('board:regenerated');
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
