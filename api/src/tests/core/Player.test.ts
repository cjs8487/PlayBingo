import { mock } from 'jest-mock-extended';
import Player from '../../core/Player';
import Room from '../../core/Room';

const room = mock<Room>();

const createPlayer = () =>
    new Player(room, 'test', 'Test Player', 'blue', false, false);

describe('Goal Tracking', () => {
    it('Correctly marks unmarked cells', () => {
        const player = createPlayer();
        player.mark(0);
        expect(player.markedGoals).toEqual(1n);
        player.mark(4);
        expect(player.markedGoals).toEqual(BigInt(0b10001));
        player.mark(3);
        player.mark(9);
        expect(player.markedGoals).toEqual(BigInt(0b1000011001));
    });

    it("Doesn't change marked cells when marking a cell that is already marked", () => {
        const player = createPlayer();
        player.mark(0);
        player.mark(7);
        const original = player.markedGoals;
        player.mark(7);
        expect(player.markedGoals).toEqual(original);
    });

    it('Correctly unmarks marked cells', () => {
        const player = createPlayer();
        player.mark(0);
        player.mark(7);
        player.mark(9);
        player.mark(12);
        player.mark(15);
        player.mark(17);
        player.unmark(12);
        expect(player.markedGoals).toEqual(BigInt(0b101000001010000001));
        player.unmark(17);
        player.unmark(9);
        expect(player.markedGoals).toEqual(BigInt(0b1000000010000001));
    });

    it("Doesn't change marked cells when unmarking a cell that is not marked", () => {
        const player = createPlayer();
        player.mark(0);
        player.mark(7);
        const original = player.markedGoals;
        player.unmark(15);
        expect(player.markedGoals).toEqual(original);
    });

    it('Correctly tells if a cell is marked', () => {
        const player = createPlayer();
        const toMark = [3, 7, 9, 16, 21];
        const unmarked = Array.from(Array(25), (_, index) => index).filter(
            (index) => !toMark.includes(index),
        );
        toMark.forEach((index) => player.mark(index));
        toMark.forEach((index) => expect(player.hasMarked(index)).toBeTruthy());
        unmarked.forEach((index) =>
            expect(player.hasMarked(index)).toBeFalsy(),
        );
    });

    it('Correctly determines if a set of goals is marked', () => {
        const player = createPlayer();
        player.mark(0);
        player.mark(1);
        player.mark(2);
        player.mark(3);
        player.mark(4);
        player.mark(5);
        player.mark(10);
        player.mark(15);
        player.mark(20);
        const row1Mask = BigInt(0b11111);
        const row2Mask = BigInt(0b1111100000);
        const col1Mask = BigInt(0b0000100001000010000100001);
        expect(player.hasCompletedGoals(row1Mask)).toBeTruthy();
        expect(player.hasCompletedGoals(col1Mask)).toBeTruthy();
        expect(player.hasCompletedGoals(row2Mask)).toBeFalsy();
    });
});
