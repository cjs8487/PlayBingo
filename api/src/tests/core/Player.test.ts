import { mock } from 'jest-mock-extended';
import { OPEN } from 'ws';
import Player from '../../core/Player';
import Room from '../../core/Room';
import { RevealedCell } from '@playbingo/types';
import { PlayBingoSocketLike } from '../../core/PlayBingoSocket';
import RaceHandler from '../../core/integration/races/RaceHandler';

const room = mock<Room>();
room.board = [Array(5).fill(mock<RevealedCell>()), [], [], [], []];

const createPlayer = () =>
    new Player(room, 'test', 'Test Player', 'blue', false, false);

describe('Goal Tracking', () => {
    beforeEach(() => {
        room.exploration = false;
    });

    it('Correctly marks unmarked cells', () => {
        const player = createPlayer();
        player.mark(0, 0);
        expect(player.markedGoals).toEqual(1n);
        expect(player.goalCount).toEqual(1);
        player.mark(0, 4);
        expect(player.markedGoals).toEqual(BigInt(0b10001));
        expect(player.goalCount).toEqual(2);
        player.mark(0, 3);
        player.mark(1, 4);
        expect(player.markedGoals).toEqual(BigInt(0b1000011001));
        expect(player.goalCount).toEqual(4);
    });

    it("Doesn't change marked cells when marking a cell that is already marked", () => {
        const player = createPlayer();
        player.mark(0, 0);
        player.mark(1, 2);
        const original = player.markedGoals;
        player.mark(1, 2);
        expect(player.markedGoals).toEqual(original);
        expect(player.goalCount).toEqual(2);
    });

    it('Correctly unmarks marked cells', () => {
        const player = createPlayer();
        player.mark(0, 0);
        player.mark(1, 2);
        player.mark(1, 4);
        player.mark(2, 2);
        player.mark(3, 0);
        player.mark(3, 2);
        player.unmark(2, 2);
        expect(player.markedGoals).toEqual(BigInt(0b101000001010000001));
        expect(player.goalCount).toEqual(5);
        player.unmark(3, 2);
        player.unmark(1, 4);
        expect(player.goalCount).toEqual(3);
        expect(player.markedGoals).toEqual(BigInt(0b1000000010000001));
    });

    it("Doesn't change marked cells when unmarking a cell that is not marked", () => {
        const player = createPlayer();
        player.mark(0, 0);
        player.mark(1, 3);
        const original = player.markedGoals;
        player.unmark(3, 0);
        expect(player.markedGoals).toEqual(original);
        expect(player.goalCount).toEqual(2);
    });

    it('Correctly tells if a cell is marked', () => {
        const player = createPlayer();
        const toMark = [3, 7, 9, 16, 21];
        const unmarked = Array.from(Array(25), (_, index) => index).filter(
            (index) => !toMark.includes(index),
        );
        toMark.forEach((index) =>
            player.mark(index % 5, Math.floor(index / 5)),
        );
        toMark.forEach((index) =>
            expect(
                player.hasMarked(index % 5, Math.floor(index / 5)),
            ).toBeTruthy(),
        );
        unmarked.forEach((index) =>
            expect(
                player.hasMarked(index % 5, Math.floor(index / 5)),
            ).toBeFalsy(),
        );
    });

    it('Correctly determines if a set of goals is marked', () => {
        const player = createPlayer();
        player.mark(0, 0);
        player.mark(0, 1);
        player.mark(0, 2);
        player.mark(0, 3);
        player.mark(0, 4);
        player.mark(1, 0);
        player.mark(2, 0);
        player.mark(3, 0);
        player.mark(4, 0);
        const row1Mask = BigInt(0b11111);
        const row2Mask = BigInt(0b1111100000);
        const col1Mask = BigInt(0b0000100001000010000100001);
        expect(player.hasCompletedGoals(row1Mask)).toBeTruthy();
        expect(player.hasCompletedGoals(col1Mask)).toBeTruthy();
        expect(player.hasCompletedGoals(row2Mask)).toBeFalsy();
    });
});

describe('Room event subscriptions', () => {
    const createConnectedPlayer = () => {
        const subscribedRoom = mock<Room>();
        subscribedRoom.board = [
            Array(5).fill(mock<RevealedCell>()),
            [],
            [],
            [],
            [],
        ];
        subscribedRoom.exploration = false;
        subscribedRoom.alwaysRevealedMask = 0n;
        subscribedRoom.raceHandler = mock<RaceHandler>();
        subscribedRoom.getPlayers.mockReturnValue([]);
        const player = new Player(
            subscribedRoom,
            'test',
            'Test Player',
            'blue',
            false,
            false,
        );
        const socket = mock<PlayBingoSocketLike>();
        socket.readyState = OPEN;
        player.addConnection('connection-1', socket);
        return { player, room: subscribedRoom, socket };
    };

    it('fans room events out through all player connections', () => {
        const {
            player,
            room: subscribedRoom,
            socket,
        } = createConnectedPlayer();
        const secondSocket = mock<PlayBingoSocketLike>();
        secondSocket.readyState = OPEN;
        player.addConnection('connection-2', secondSocket);
        const cell = mock<RevealedCell>();
        const goalMarkedListener = subscribedRoom.on.mock.calls.find(
            ([event]) => event === 'board:goalMarked',
        )?.[1];

        goalMarkedListener?.(cell, 2, 3, player);

        expect(socket.send).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'cellUpdate',
                row: 2,
                col: 3,
                cell,
                connectedPlayer: expect.objectContaining({ id: player.id }),
            }),
        );
        expect(secondSocket.send).toHaveBeenCalledTimes(1);
        expect(subscribedRoom.on).toHaveBeenCalledTimes(7);
    });

    it('unsubscribes only after the last player connection closes', () => {
        const { player, room: subscribedRoom } = createConnectedPlayer();
        const secondSocket = mock<PlayBingoSocketLike>();
        secondSocket.readyState = OPEN;
        player.addConnection('connection-2', secondSocket);

        player.closeConnection('connection-1');
        expect(subscribedRoom.off).not.toHaveBeenCalled();

        player.closeConnection('connection-2');
        expect(subscribedRoom.off).toHaveBeenCalledTimes(7);
    });
});

describe('Exploration', () => {
    beforeEach(() => {
        room.exploration = true;
        room.alwaysRevealedMask = 1n;
    });

    it('Correctly reveals cells when marking with exploration enabled', () => {
        const player = createPlayer();
        player.room.exploration = true;
        player.mark(2, 2);
        expect(player.hasRevealed(1, 2)).toBeTruthy();
        expect(player.hasRevealed(3, 2)).toBeTruthy();
        expect(player.hasRevealed(2, 1)).toBeTruthy();
        expect(player.hasRevealed(2, 3)).toBeTruthy();
    });

    it('Correctly hides cells when marking with exploration enabled', () => {
        const player = createPlayer();
        player.room.exploration = true;
        player.mark(2, 2);
        player.unmark(2, 2);
        expect(player.hasRevealed(1, 2)).toBeFalsy();
        expect(player.hasRevealed(3, 2)).toBeFalsy();
        expect(player.hasRevealed(2, 1)).toBeFalsy();
        expect(player.hasRevealed(2, 3)).toBeFalsy();
    });
});
