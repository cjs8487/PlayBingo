import {
    ChatAction,
    JoinAction,
    LeaveAction,
    MarkAction,
    RevealedCell,
    ServerMessage,
    UnmarkAction,
} from '@playbingo/types';
import { mockDeep, mockReset } from 'jest-mock-extended';
import WebSocket from 'ws';
import { RoomTokenPayload } from '../../auth/RoomAuth';
import Player from '../../core/Player';
import Room from '../../core/Room';
import { mockCreateRoomAction, mockPlayerUpsert } from '../setup';

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
const mockSocket = mockDeep<WebSocket>();
const mockSocket2 = mockDeep<WebSocket>();

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
    );
    room.board = mockDeep<RevealedCell[][]>();

    mockReset(mockJoinAction);
    mockReset(mockTokenPayload);
    mockReset(mockTokenPayload2);
    mockReset(mockTokenPayloadPlayer2);
    mockReset(mockSocket);
    mockReset(mockSocket2);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('handleJoin', () => {
    it('Creates a new player when a new player joins', () => {
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        expect(room.players.has(mockTokenPayload.playerId)).toBe(true);
        expect(mockCreateRoomAction).toHaveBeenCalled();
        expect(mockPlayerUpsert).toHaveBeenCalled();
        expect(
            room.players.get(mockTokenPayload.playerId)?.connections.size,
        ).toBe(1);
    });

    it('Adds a new connection to an existing player', () => {
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        room.handleJoin(mockJoinAction, mockTokenPayload2, mockSocket2);
        expect(
            room.players.get(mockTokenPayload.playerId)?.connections.size,
        ).toBe(2);
        expect(room.players.has(mockTokenPayload.playerId)).toBe(true);
        expect(room.players.size).toBe(1);
    });

    it('Creates two new players when two new players join', () => {
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        room.handleJoin(mockJoinAction, mockTokenPayloadPlayer2, mockSocket2);
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
        expect(mockCreateRoomAction).toHaveBeenCalledTimes(2);
        expect(mockPlayerUpsert).toHaveBeenCalledTimes(2);
    });

    it('Sends join message for new players', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        mockJoinAction.payload = { nickname: 'player 1' };
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        mockJoinAction.payload = { nickname: 'player 2' };
        room.handleJoin(mockJoinAction, mockTokenPayloadPlayer2, mockSocket2);
        expect(sendChatSpy).toHaveBeenCalledTimes(2);
        expect(sendChatSpy).toHaveBeenCalledWith([
            { contents: 'player 1', color: 'blue' },
            ' has joined.',
        ]);
        expect(sendChatSpy).toHaveBeenCalledWith([
            { contents: 'player 2', color: 'blue' },
            ' has joined.',
        ]);
    });

    it('Sends spectator join message for new spectators', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        mockJoinAction.payload = { nickname: 'spectator' };
        room.handleJoin(mockJoinAction, mockTokenPayloadSpectator, mockSocket);
        expect(sendChatSpy).toHaveBeenCalledTimes(1);
        expect(sendChatSpy).toHaveBeenCalledWith('spectator is now spectating');
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
        expect(mockCreateRoomAction).toHaveBeenCalledTimes(1);
        expect(sendChatSpy).toHaveBeenCalledTimes(1);
        expect(sendChatSpy).toHaveBeenCalledWith([
            { contents: 'Test Player', color: 'blue' },
            ' has left.',
        ]);
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
        expect(mockCreateRoomAction).not.toHaveBeenCalled();
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
        );
        expect(mockCreateRoomAction).toHaveBeenCalledTimes(1);
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
        });

        it('Sends a cell message update', () => {
            const playerSendSpy = jest.spyOn(
                room.players.get(mockTokenPayload.playerId)!,
                'sendMessage',
            );
            const player2SendSpy = jest.spyOn(
                room.players.get(mockTokenPayloadPlayer2.playerId)!,
                'sendMessage',
            );
            room.handleMark(mockMarkAction, mockTokenPayload);
            const cellUpdateMessage: ServerMessage = {
                action: 'cellUpdate',
                row: mockMarkAction.payload.row,
                col: mockMarkAction.payload.col,
                cell: room.board[mockMarkAction.payload.row][
                    mockMarkAction.payload.col
                ],
                players: room.getPlayers(),
            };
            expect(playerSendSpy).toHaveBeenCalledWith(cellUpdateMessage);
            expect(player2SendSpy).toHaveBeenCalledWith(cellUpdateMessage);
        });

        it('Sends a chat message', () => {
            const sendChatSpy = jest.spyOn(room, 'sendChat');
            const player = room.players.get(mockTokenPayload.playerId)!;
            const { row, col } = mockMarkAction.payload;
            room.handleMark(mockMarkAction, mockTokenPayload);
            expect(sendChatSpy).toHaveBeenCalledTimes(1);
            expect(sendChatSpy).toHaveBeenCalledWith([
                {
                    contents: player.nickname,
                    color: player.color,
                },
                ` marked ${room.board[row][col].goal.goal} (${row},${col})`,
            ]);
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
            const playerSendSpy = jest.spyOn(
                room.players.get(mockTokenPayload.playerId)!,
                'sendMessage',
            );
            const player2SendSpy = jest.spyOn(
                room.players.get(mockTokenPayloadPlayer2.playerId)!,
                'sendMessage',
            );
            room.handleUnmark(mockUnmarkAction, mockTokenPayload);
            const cellUpdateMessage: ServerMessage = {
                action: 'cellUpdate',
                row: mockMarkAction.payload.row,
                col: mockMarkAction.payload.col,
                cell: room.board[mockMarkAction.payload.row][
                    mockMarkAction.payload.col
                ],
                players: room.getPlayers(),
            };
            expect(playerSendSpy).toHaveBeenCalledWith(cellUpdateMessage);
            expect(player2SendSpy).toHaveBeenCalledWith(cellUpdateMessage);
        });

        it('Sends a chat message', () => {
            const sendChatSpy = jest.spyOn(room, 'sendChat');
            const player = room.players.get(mockTokenPayload.playerId)!;
            const { row, col } = mockMarkAction.payload;
            room.handleUnmark(mockUnmarkAction, mockTokenPayload);
            expect(sendChatSpy).toHaveBeenCalledTimes(1);
            expect(sendChatSpy).toHaveBeenCalledWith([
                {
                    contents: player.nickname,
                    color: player.color,
                },
                ` unmarked ${room.board[row][col].goal.goal} (${row},${col})`,
            ]);
        });
        // TODO: TEST UNAUTHORIZED
    });
});
