import { Cell } from '../../types/Cell';
import { checkCompletedLines, listToBoard } from '../../util/RoomUtils';

const createBoard = (): Cell[][] =>
    listToBoard(
        Array.from({ length: 25 }).map((_, i) => ({
            goal: `Goal ${i + 1}`,
            categories: [],
            difficulty: 0,
            description: '',
        })),
    );

describe('Win Conditions', () => {
    it('Detects no win conditions on an empty board', () => {
        const board = createBoard();
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({});
    });

    it('Correctly detects single rows', () => {
        const board = createBoard();
        board[0][0].colors = ['blue'];
        board[0][1].colors = ['blue'];
        board[0][2].colors = ['blue'];
        board[0][3].colors = ['blue'];
        board[0][4].colors = ['blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({ blue: 1 });
    });

    it('Correctly detects single rows with additional values on the board', () => {
        const board = createBoard();
        board[0][0].colors = ['blue', 'red'];
        board[0][1].colors = ['blue'];
        board[0][2].colors = ['blue'];
        board[0][3].colors = ['red', 'blue', 'green'];
        board[0][4].colors = ['blue'];
        board[4][2].colors = ['red'];
        board[4][3].colors = ['red', 'green'];
        board[3][1].colors = ['blue', 'red', 'green'];
        board[1][4].colors = ['blue', 'green'];
        board[2][2].colors = ['green', 'blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({
            blue: 1,
            red: 0,
            green: 0,
        });
    });

    it('Correctly detects multiple rows', () => {
        const board = createBoard();
        board[0][0].colors = ['blue', 'red'];
        board[0][1].colors = ['blue'];
        board[0][2].colors = ['blue'];
        board[0][3].colors = ['red', 'blue', 'green'];
        board[0][4].colors = ['blue'];
        board[1][0].colors = ['red', 'blue'];
        board[1][1].colors = ['blue', 'red'];
        board[1][2].colors = ['blue'];
        board[1][3].colors = ['blue'];
        board[1][4].colors = ['blue', 'green'];
        board[2][2].colors = ['green', 'blue'];
        board[3][1].colors = ['blue', 'red', 'green'];
        board[4][2].colors = ['red'];
        board[4][3].colors = ['red', 'green'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({
            blue: 2,
            green: 0,
            red: 0,
        });
    });

    it('Correctly detects single columns', () => {
        const board = createBoard();
        board[0][0].colors = ['blue'];
        board[1][0].colors = ['blue'];
        board[2][0].colors = ['blue'];
        board[3][0].colors = ['blue'];
        board[4][0].colors = ['blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({ blue: 1 });
    });

    it('Correctly detects single column with additional values on the board', () => {
        const board = createBoard();
        board[0][0].colors = ['blue'];
        board[1][0].colors = ['blue', 'red'];
        board[2][0].colors = ['green', 'blue'];
        board[3][0].colors = ['blue'];
        board[4][0].colors = ['blue', 'red', 'green'];
        board[4][2].colors = ['red'];
        board[4][3].colors = ['red', 'green'];
        board[3][1].colors = ['blue', 'red', 'green'];
        board[1][4].colors = ['blue', 'green'];
        board[2][2].colors = ['green', 'blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({
            blue: 1,
            red: 0,
            green: 0,
        });
    });

    it('Correctly detects multiple columns', () => {
        const board = createBoard();
        board[0][0].colors = ['blue'];
        board[1][0].colors = ['blue', 'red'];
        board[2][0].colors = ['green', 'blue'];
        board[3][0].colors = ['blue'];
        board[4][0].colors = ['blue', 'red', 'green'];
        board[0][3].colors = ['blue'];
        board[1][3].colors = ['blue', 'red'];
        board[2][3].colors = ['green', 'blue'];
        board[3][3].colors = ['blue'];
        board[4][3].colors = ['blue', 'red', 'green'];
        board[2][2].colors = ['green', 'blue'];
        board[3][1].colors = ['blue', 'red', 'green'];
        board[4][2].colors = ['red'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({
            blue: 2,
            green: 0,
            red: 0,
        });
    });

    it('Correctly detects the main diagonal', () => {
        const board = createBoard();
        board[0][0].colors = ['blue'];
        board[1][1].colors = ['blue'];
        board[2][2].colors = ['blue'];
        board[3][3].colors = ['blue'];
        board[4][4].colors = ['blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({ blue: 1 });
    });

    it('Correctly detects the antiDiagonal', () => {
        const board = createBoard();
        board[0][4].colors = ['blue'];
        board[1][3].colors = ['blue'];
        board[2][2].colors = ['blue'];
        board[3][1].colors = ['blue'];
        board[4][0].colors = ['blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({ blue: 1 });
    });

    it('Correctly detects mixed lines and colors', () => {
        const board = createBoard();
        board[0][0].colors = ['blue', 'green'];
        board[0][1].colors = ['blue', 'red', 'green'];
        board[0][2].colors = ['green', 'blue'];
        board[0][3].colors = ['blue', 'green'];
        board[0][4].colors = ['blue', 'red', 'green', 'yellow', 'orange'];
        board[1][0].colors = ['blue', 'red', 'orange'];
        board[2][0].colors = ['green', 'blue'];
        board[3][0].colors = ['blue'];
        board[4][0].colors = ['blue', 'yellow', 'green', 'orange'];
        board[1][1].colors = ['blue', 'red', 'green'];
        board[2][2].colors = ['green'];
        board[3][3].colors = ['red', 'green'];
        board[4][4].colors = ['blue', 'red', 'green'];
        board[1][3].colors = ['blue', 'red'];
        board[2][3].colors = ['green', 'blue'];
        board[4][3].colors = ['blue', 'red', 'green'];
        board[3][1].colors = ['blue', 'red', 'green'];
        board[4][2].colors = ['red', 'yellow'];
        board[4][3].colors = ['red', 'green', 'orange'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({
            blue: 2,
            green: 2,
            red: 0,
            orange: 0,
            yellow: 0,
        });
    });
});
