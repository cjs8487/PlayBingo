import { Cell } from '@playbingo/types';
import { checkCompletedLines, listToBoard } from '../../util/RoomUtils';

const createBoard = (): Cell[][] =>
    listToBoard(
        Array.from({ length: 25 }).map((_, i) => ({
            id: `${i}`,
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
        board[0][0].completedPlayers = ['blue'];
        board[0][1].completedPlayers = ['blue'];
        board[0][2].completedPlayers = ['blue'];
        board[0][3].completedPlayers = ['blue'];
        board[0][4].completedPlayers = ['blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({ blue: 1 });
    });

    it('Correctly detects single rows with additional values on the board', () => {
        const board = createBoard();
        board[0][0].completedPlayers = ['blue', 'red'];
        board[0][1].completedPlayers = ['blue'];
        board[0][2].completedPlayers = ['blue'];
        board[0][3].completedPlayers = ['red', 'blue', 'green'];
        board[0][4].completedPlayers = ['blue'];
        board[4][2].completedPlayers = ['red'];
        board[4][3].completedPlayers = ['red', 'green'];
        board[3][1].completedPlayers = ['blue', 'red', 'green'];
        board[1][4].completedPlayers = ['blue', 'green'];
        board[2][2].completedPlayers = ['green', 'blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({
            blue: 1,
            red: 0,
            green: 0,
        });
    });

    it('Correctly detects multiple rows', () => {
        const board = createBoard();
        board[0][0].completedPlayers = ['blue', 'red'];
        board[0][1].completedPlayers = ['blue'];
        board[0][2].completedPlayers = ['blue'];
        board[0][3].completedPlayers = ['red', 'blue', 'green'];
        board[0][4].completedPlayers = ['blue'];
        board[1][0].completedPlayers = ['red', 'blue'];
        board[1][1].completedPlayers = ['blue', 'red'];
        board[1][2].completedPlayers = ['blue'];
        board[1][3].completedPlayers = ['blue'];
        board[1][4].completedPlayers = ['blue', 'green'];
        board[2][2].completedPlayers = ['green', 'blue'];
        board[3][1].completedPlayers = ['blue', 'red', 'green'];
        board[4][2].completedPlayers = ['red'];
        board[4][3].completedPlayers = ['red', 'green'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({
            blue: 2,
            green: 0,
            red: 0,
        });
    });

    it('Correctly detects single columns', () => {
        const board = createBoard();
        board[0][0].completedPlayers = ['blue'];
        board[1][0].completedPlayers = ['blue'];
        board[2][0].completedPlayers = ['blue'];
        board[3][0].completedPlayers = ['blue'];
        board[4][0].completedPlayers = ['blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({ blue: 1 });
    });

    it('Correctly detects single column with additional values on the board', () => {
        const board = createBoard();
        board[0][0].completedPlayers = ['blue'];
        board[1][0].completedPlayers = ['blue', 'red'];
        board[2][0].completedPlayers = ['green', 'blue'];
        board[3][0].completedPlayers = ['blue'];
        board[4][0].completedPlayers = ['blue', 'red', 'green'];
        board[4][2].completedPlayers = ['red'];
        board[4][3].completedPlayers = ['red', 'green'];
        board[3][1].completedPlayers = ['blue', 'red', 'green'];
        board[1][4].completedPlayers = ['blue', 'green'];
        board[2][2].completedPlayers = ['green', 'blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({
            blue: 1,
            red: 0,
            green: 0,
        });
    });

    it('Correctly detects multiple columns', () => {
        const board = createBoard();
        board[0][0].completedPlayers = ['blue'];
        board[1][0].completedPlayers = ['blue', 'red'];
        board[2][0].completedPlayers = ['green', 'blue'];
        board[3][0].completedPlayers = ['blue'];
        board[4][0].completedPlayers = ['blue', 'red', 'green'];
        board[0][3].completedPlayers = ['blue'];
        board[1][3].completedPlayers = ['blue', 'red'];
        board[2][3].completedPlayers = ['green', 'blue'];
        board[3][3].completedPlayers = ['blue'];
        board[4][3].completedPlayers = ['blue', 'red', 'green'];
        board[2][2].completedPlayers = ['green', 'blue'];
        board[3][1].completedPlayers = ['blue', 'red', 'green'];
        board[4][2].completedPlayers = ['red'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({
            blue: 2,
            green: 0,
            red: 0,
        });
    });

    it('Correctly detects the main diagonal', () => {
        const board = createBoard();
        board[0][0].completedPlayers = ['blue'];
        board[1][1].completedPlayers = ['blue'];
        board[2][2].completedPlayers = ['blue'];
        board[3][3].completedPlayers = ['blue'];
        board[4][4].completedPlayers = ['blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({ blue: 1 });
    });

    it('Correctly detects the antiDiagonal', () => {
        const board = createBoard();
        board[0][4].completedPlayers = ['blue'];
        board[1][3].completedPlayers = ['blue'];
        board[2][2].completedPlayers = ['blue'];
        board[3][1].completedPlayers = ['blue'];
        board[4][0].completedPlayers = ['blue'];
        const winStatus = checkCompletedLines(board);
        expect(winStatus).toStrictEqual({ blue: 1 });
    });

    it('Correctly detects mixed lines and colors', () => {
        const board = createBoard();
        board[0][0].completedPlayers = ['blue', 'green'];
        board[0][1].completedPlayers = ['blue', 'red', 'green'];
        board[0][2].completedPlayers = ['green', 'blue'];
        board[0][3].completedPlayers = ['blue', 'green'];
        board[0][4].completedPlayers = [
            'blue',
            'red',
            'green',
            'yellow',
            'orange',
        ];
        board[1][0].completedPlayers = ['blue', 'red', 'orange'];
        board[2][0].completedPlayers = ['green', 'blue'];
        board[3][0].completedPlayers = ['blue'];
        board[4][0].completedPlayers = ['blue', 'yellow', 'green', 'orange'];
        board[1][1].completedPlayers = ['blue', 'red', 'green'];
        board[2][2].completedPlayers = ['green'];
        board[3][3].completedPlayers = ['red', 'green'];
        board[4][4].completedPlayers = ['blue', 'red', 'green'];
        board[1][3].completedPlayers = ['blue', 'red'];
        board[2][3].completedPlayers = ['green', 'blue'];
        board[4][3].completedPlayers = ['blue', 'red', 'green'];
        board[3][1].completedPlayers = ['blue', 'red', 'green'];
        board[4][2].completedPlayers = ['red', 'yellow'];
        board[4][3].completedPlayers = ['red', 'green', 'orange'];
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
