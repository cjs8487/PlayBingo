import { BingoMode } from '@prisma/client';
import {
    shutdownRoomDatabaseListeners,
    subscribe,
    unsubscribe,
} from '../../core/DatabaseEventListeners';
import Player from '../../core/Player';
import Room from '../../core/Room';
import {
    addChatAction,
    setRoomBoard,
    updateTeamsEnabled,
} from '../../database/Rooms';

jest.mock('../../database/Rooms');

describe('DatabaseEventListeners', () => {
    it('keeps board, action, and state writes in order after a failed write', async () => {
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
        );
        subscribe(room);
        const player = new Player(room, 'alice', 'Alice', false);

        let rejectBoard!: (error: Error) => void;
        jest.mocked(setRoomBoard).mockImplementationOnce(
            () =>
                new Promise<void>((_resolve, reject) => {
                    rejectBoard = reject;
                }),
        );
        const logError = jest
            .spyOn(room, 'logError')
            .mockImplementation(() => {});

        room.emit(
            'board:regenerated',
            room.board,
            room.lastGenerationMode,
            new Date(),
        );
        const onDrained = jest.fn();
        const drain = shutdownRoomDatabaseListeners().then(onDrained);
        room.emit('player:chat', player, 'hello', new Date());
        unsubscribe(room.id);
        subscribe(room);
        room.emit('room:teamsEnabledChanged', true);

        try {
            await new Promise<void>((resolve) => setImmediate(resolve));
            expect(setRoomBoard).toHaveBeenCalledTimes(1);
            expect(addChatAction).not.toHaveBeenCalled();
            expect(updateTeamsEnabled).not.toHaveBeenCalled();
            expect(onDrained).not.toHaveBeenCalled();
        } finally {
            rejectBoard(new Error('board write failed'));
            await drain;
        }
        expect(onDrained).toHaveBeenCalledTimes(1);
        expect(room.listenerCount('room:teamsEnabledChanged')).toBe(0);
        expect(addChatAction).toHaveBeenCalledTimes(1);
        expect(updateTeamsEnabled).toHaveBeenCalledTimes(1);
        expect(
            jest.mocked(addChatAction).mock.invocationCallOrder[0],
        ).toBeLessThan(
            jest.mocked(updateTeamsEnabled).mock.invocationCallOrder[0],
        );
        expect(logError).toHaveBeenCalledWith(
            expect.stringContaining('board write failed'),
        );
    });
});
