import { BingoMode } from '@prisma/client';
import Room from '../../core/Room';
import { allRooms } from '../../core/RoomServer';
import { roomCleanupInactive } from '../../Environment';

afterEach(() => {
    jest.clearAllMocks();
});

const createRoom = () =>
    new Room(
        'Unit Testing Room',
        'Unit Test Game',
        'unittest',
        'unit-test-0001,',
        '',
        '1',
        false,
        BingoMode.LINES,
        1,
        false,
        'Normal',
    );

describe('canClose()', () => {
    it('Returns false for a newly initialized room', () => {
        const room = createRoom();
        expect(room.canClose()).toBe(false);
    });

    it('Returns false when the last message was before the timeout', () => {
        const room = createRoom();
        room.lastMessage = Date.now();
        expect(room.canClose()).toBe(false);
    });

    it('Returns true when the last message was after the timeout', () => {
        const room = createRoom();
        room.lastMessage = Date.now() - roomCleanupInactive - 1000 * 60;
        expect(room.canClose()).toBe(true);
    });
});

describe('close()', () => {
    it('Removes the room from the active room list', () => {
        const room = createRoom();
        allRooms.set(room.slug, room);
        room.close();
        expect(allRooms.has(room.slug)).toBe(false);
    });
});

describe('Inactivity timeout', () => {
    jest.useFakeTimers();
    it('Gets called on a timeout', () => {
        const room = createRoom();
        jest.spyOn(room, 'warnClose');
        jest.spyOn(room, 'close');
        expect(room.warnClose).not.toHaveBeenCalled();
        jest.runOnlyPendingTimers();
        expect(room.warnClose).toHaveBeenCalledTimes(1);
        expect(room.close).not.toHaveBeenCalled();
        jest.runOnlyPendingTimers();
        expect(room.close).toHaveBeenCalledTimes(1);
    });
});
