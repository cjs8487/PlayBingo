import { mock } from 'jest-mock-extended';
import Player from '../../core/Player';
import Room from '../../core/Room';
import { RevealedCell } from '@playbingo/types';
import Team from '../../core/Team';

const room = mock<Room>();
room.board = [Array(5).fill(mock<RevealedCell>()), [], [], [], []];

const createTeam = () => new Team(room, 'test', 'Test Team');

const createPlayer = (team?: Team) =>
    new Player(
        room,
        'test',
        'Test Player',
        'blue',
        false,
        team ? team.obfuscateBoard : room.spectatorObfuscateBoard,
        team?.id,
    );

describe('Goal Tracking', () => {
    beforeEach(() => {
        room.exploration = false;
    });

    it('Correctly marks unmarked cells', () => {
        const team = createTeam();
        const player = createPlayer(team);
        team.mark(0, 0);
        expect(team.markedGoals).toEqual(1n);
        expect(team.goalCount).toEqual(1);
        team.mark(0, 4);
        expect(team.markedGoals).toEqual(BigInt(0b10001));
        expect(team.goalCount).toEqual(2);
        team.mark(0, 3);
        team.mark(1, 4);
        expect(team.markedGoals).toEqual(BigInt(0b1000011001));
        expect(team.goalCount).toEqual(4);
    });

    it("Doesn't change marked cells when marking a cell that is already marked", () => {
        const team = createTeam();
        const player = createPlayer(team);
        team.mark(0, 0);
        team.mark(1, 2);
        const original = team.markedGoals;
        team.mark(1, 2);
        expect(team.markedGoals).toEqual(original);
        expect(team.goalCount).toEqual(2);
    });

    it('Correctly unmarks marked cells', () => {
        const team = createTeam();
        const player = createPlayer(team);
        team.mark(0, 0);
        team.mark(1, 2);
        team.mark(1, 4);
        team.mark(2, 2);
        team.mark(3, 0);
        team.mark(3, 2);
        team.unmark(2, 2);
        expect(team.markedGoals).toEqual(BigInt(0b101000001010000001));
        expect(team.goalCount).toEqual(5);
        team.unmark(3, 2);
        team.unmark(1, 4);
        expect(team.goalCount).toEqual(3);
        expect(team.markedGoals).toEqual(BigInt(0b1000000010000001));
    });

    it("Doesn't change marked cells when unmarking a cell that is not marked", () => {
        const team = createTeam();
        const player = createPlayer(team);
        team.mark(0, 0);
        team.mark(1, 3);
        const original = team.markedGoals;
        team.unmark(3, 0);
        expect(team.markedGoals).toEqual(original);
        expect(team.goalCount).toEqual(2);
    });

    it('Correctly tells if a cell is marked', () => {
        const team = createTeam();
        const player = createPlayer(team);
        const toMark = [3, 7, 9, 16, 21];
        const unmarked = Array.from(Array(25), (_, index) => index).filter(
            (index) => !toMark.includes(index),
        );
        toMark.forEach((index) =>
            team.mark(index % 5, Math.floor(index / 5)),
        );
        toMark.forEach((index) =>
            expect(
                team.hasMarked(index % 5, Math.floor(index / 5)),
            ).toBeTruthy(),
        );
        unmarked.forEach((index) =>
            expect(
                team.hasMarked(index % 5, Math.floor(index / 5)),
            ).toBeFalsy(),
        );
    });

    it('Correctly determines if a set of goals is marked', () => {
        const team = createTeam();
        const player = createPlayer(team);
        team.mark(0, 0);
        team.mark(0, 1);
        team.mark(0, 2);
        team.mark(0, 3);
        team.mark(0, 4);
        team.mark(1, 0);
        team.mark(2, 0);
        team.mark(3, 0);
        team.mark(4, 0);
        const row1Mask = BigInt(0b11111);
        const row2Mask = BigInt(0b1111100000);
        const col1Mask = BigInt(0b0000100001000010000100001);
        expect(team.hasCompletedGoals(row1Mask)).toBeTruthy();
        expect(team.hasCompletedGoals(col1Mask)).toBeTruthy();
        expect(team.hasCompletedGoals(row2Mask)).toBeFalsy();
    });
});

describe('Exploration', () => {
    beforeEach(() => {
        room.exploration = true;
        room.alwaysRevealedMask = 1n;
    });

    it('Correctly reveals cells when marking with exploration enabled', () => {
        const team = createTeam();
        const player = createPlayer(team);
        team.room.exploration = true;
        team.mark(2, 2);
        expect(team.hasRevealed(1, 2)).toBeTruthy();
        expect(team.hasRevealed(3, 2)).toBeTruthy();
        expect(team.hasRevealed(2, 1)).toBeTruthy();
        expect(team.hasRevealed(2, 3)).toBeTruthy();
    });

    it('Correctly hides cells when marking with exploration enabled', () => {
        const team = createTeam();
        team.room.exploration = true;
        team.mark(2, 2);
        team.unmark(2, 2);
        expect(team.hasRevealed(1, 2)).toBeFalsy();
        expect(team.hasRevealed(3, 2)).toBeFalsy();
        expect(team.hasRevealed(2, 1)).toBeFalsy();
        expect(team.hasRevealed(2, 3)).toBeFalsy();
        expect(team.hasRevealed(2, 3)).toBeFalsy();
    });
});
