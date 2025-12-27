import { mock, mockReset } from 'jest-mock-extended';
import Room from '../../core/Room';
import { JoinAction, LeaveAction, RevealedCell } from '@playbingo/types';
import { RoomTokenPayload } from '../../auth/RoomAuth';
import WebSocket from 'ws';
import { mockCreateRoomAction, mockPlayerUpsert } from '../setup';
import Player from '../../core/Player';

let room: Room;

const mockJoinAction = mock<JoinAction>();
const mockLeaveAction = mock<LeaveAction>();

const mockTokenPayload = mock<RoomTokenPayload>();
mockTokenPayload.playerId = 'test';
mockTokenPayload.isSpectating = false;
const mockTokenPayload2 = mock<RoomTokenPayload>();
mockTokenPayload2.playerId = 'test';
const mockTokenPayloadPlayer2 = mock<RoomTokenPayload>();
mockTokenPayloadPlayer2.playerId = 'test2';
mockTokenPayloadPlayer2.isSpectating = false;
const mockTokenPayloadSpectator = mock<RoomTokenPayload>();
mockTokenPayloadSpectator.playerId = 'spectator';
mockTokenPayloadSpectator.isSpectating = true;
const mockSocket = mock<WebSocket>();
const mockSocket2 = mock<WebSocket>();

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
    room.board = mock<RevealedCell[][]>();

    mockReset(mockJoinAction);
    mockReset(mockTokenPayload);
    mockReset(mockTokenPayload2);
    mockReset(mockTokenPayloadPlayer2);
    mockReset(mockSocket);
    mockReset(mockSocket2);
    mockJoinAction.payload = { nickname: 'Test Player' };
    mockTokenPayload.uuid = 'connection-1';
    mockTokenPayload2.uuid = 'connection-2';
    mockTokenPayloadPlayer2.uuid = 'connection-3';
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('handleJoin', () => {
    it('Creates a new player when a new player joins', async () => {
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBeDefined();
        expect(mockCreateRoomAction).toHaveBeenCalled();
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(mockPlayerUpsert).toHaveBeenCalled();
        expect(
            room.getPlayerById(mockTokenPayload.playerId)?.connections.size,
        ).toBe(1);
    });

    it('Adds a new connection to an existing player', () => {
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        room.handleJoin(mockJoinAction, mockTokenPayload2, mockSocket2);
        expect(
            room.getPlayerById(mockTokenPayload.playerId)?.connections.size,
        ).toBe(2);
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBeDefined();
        expect(room.getAllPlayers().length).toBe(1);
    });

    it('Creates two new players when two new players join', async () => {
        room.handleJoin(mockJoinAction, mockTokenPayload, mockSocket);
        room.handleJoin(mockJoinAction, mockTokenPayloadPlayer2, mockSocket2);
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
        expect(mockCreateRoomAction).toHaveBeenCalledTimes(2);
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(mockPlayerUpsert).toHaveBeenCalledTimes(2);
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
            expect.any(Date),
        );
        expect(sendChatSpy).toHaveBeenCalledWith(
            [
                '[0:00:00] ',
                { contents: 'player 2', color: 'blue' },
                ' has joined.',
            ],
            expect.any(Date),
        );
    });

    it('Sends spectator join message for new spectators', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        mockJoinAction.payload = { nickname: 'spectator' };
        room.handleJoin(mockJoinAction, mockTokenPayloadSpectator, mockSocket);
        expect(sendChatSpy).toHaveBeenCalledTimes(1);
        expect(sendChatSpy).toHaveBeenCalledWith(
            'spectator is now spectating',
            expect.any(Date),
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
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBe(player);
        jest.spyOn(room, 'close').mockImplementation(() => {});
        room.handleLeave(mockLeaveAction, mockTokenPayload, 'test');
        expect(player.connections.size).toBe(0);
        expect(player.showInRoom()).toBe(false);
        expect(mockCreateRoomAction).toHaveBeenCalledTimes(1);
        expect(sendChatSpy).toHaveBeenCalledTimes(1);
        expect(sendChatSpy).toHaveBeenCalledWith(
            [
                '[0:00:00] ',
                { contents: 'Test Player', color: 'blue' },
                ' has left.',
            ],
            expect.any(Date),
        );
    });

    it('Removes the connection from the player if it is not their last one', () => {
        const sendChatSpy = jest.spyOn(room, 'sendChat');
        const player = new Player(room, 'test', 'Test Player', false);
        player.addConnection(mockTokenPayload.uuid, mockSocket);
        player.addConnection(mockTokenPayload2.uuid, mockSocket);
        room.createTeamForPlayer(player);
        expect(room.getPlayerById(mockTokenPayload.playerId)).toBe(player);
        room.handleLeave(mockLeaveAction, mockTokenPayload2, 'test');
        expect(player.connections.size).toBe(1);
        expect(player.showInRoom()).toBe(true);
        expect(mockCreateRoomAction).not.toHaveBeenCalled();
        expect(sendChatSpy).not.toHaveBeenCalled();
    });
    // TODO: POST REFACTOR CHECK FOR UNAUTHORIZED RESPONSE SINCE THE RETURN TYPE
    // OF ACTION HANDLERS WILL LIKELY CHANGE
});
