import { Cell } from '@playbingo/types';
import {
    computeLineMasks,
    hasLineCompletion,
    listToBoard,
} from '../../util/RoomUtils';

const createBoard = (): Cell[][] =>
    listToBoard(
        Array.from({ length: 25 }).map((_, i) => ({
            id: `${i}`,
            goal: `Goal ${i + 1}`,
            categories: [],
            translations: {German: `Ziel ${i + 1}`},
            difficulty: 0,
            description: '',
        })),
        5,
    );

const boardToBitset = (board: Cell[][], color: string) => {
    let bitset = 0n;
    board.forEach((row, rowIndex) =>
        row.forEach((cell, colIndex) => {
            if (cell.completedPlayers.includes(color)) {
                bitset |= 1n << BigInt(rowIndex * board.length + colIndex);
            }
        }),
    );
    return bitset;
};

const standardBoardLines = computeLineMasks(5, 5);

const countLines = (board: Cell[][], color: string) => {
    let count = 0;
    const bitset = boardToBitset(board, color);
    return standardBoardLines.reduce(
        (sum, mask) => (hasLineCompletion(bitset, mask) ? sum + 1 : sum),
        0,
    );
};

describe('Mask Generation', () => {
    it('Correctly generates the line masks for a 2x2 board', () => {
        const masks = computeLineMasks(2, 2);
        expect(masks).toHaveLength(6);
        // rows
        expect(masks[0]).toEqual(BigInt(0b0011));
        expect(masks[1]).toEqual(BigInt(0b1100));
        // cols
        expect(masks[2]).toEqual(BigInt(0b0101));
        expect(masks[3]).toEqual(BigInt(0b1010));
        //diagonals
        expect(masks[4]).toEqual(BigInt(0b1001));
        expect(masks[5]).toEqual(BigInt(0b0110));
    });

    it('Correctly generates the line masks for a 5x5 board', () => {
        const masks = computeLineMasks(5, 5);
        expect(masks).toHaveLength(12);
        // rows
        expect(masks[0]).toEqual(BigInt(0b0000000000000000000011111));
        expect(masks[1]).toEqual(BigInt(0b0000000000000001111100000));
        expect(masks[2]).toEqual(BigInt(0b0000000000111110000000000));
        expect(masks[3]).toEqual(BigInt(0b0000011111000000000000000));
        expect(masks[4]).toEqual(BigInt(0b1111100000000000000000000));
        // cols
        expect(masks[5]).toEqual(BigInt(0b0000100001000010000100001));
        expect(masks[6]).toEqual(BigInt(0b0001000010000100001000010));
        expect(masks[7]).toEqual(BigInt(0b0010000100001000010000100));
        expect(masks[8]).toEqual(BigInt(0b0100001000010000100001000));
        expect(masks[9]).toEqual(BigInt(0b1000010000100001000010000));
        //diagonals
        expect(masks[10]).toEqual(BigInt(0b1000001000001000001000001));
        expect(masks[11]).toEqual(BigInt(0b0000100010001000100010000));
    });

    it('Correctly generates the line masks for a 3x6 board', () => {
        const masks = computeLineMasks(3, 6);
        expect(masks).toHaveLength(11);
        // rows
        expect(masks[0]).toEqual(BigInt(0b000000000000111111));
        expect(masks[1]).toEqual(BigInt(0b000000111111000000));
        expect(masks[2]).toEqual(BigInt(0b111111000000000000));
        // cols
        expect(masks[3]).toEqual(BigInt(0b000001000001000001));
        expect(masks[4]).toEqual(BigInt(0b000010000010000010));
        expect(masks[5]).toEqual(BigInt(0b000100000100000100));
        expect(masks[6]).toEqual(BigInt(0b001000001000001000));
        expect(masks[7]).toEqual(BigInt(0b010000010000010000));
        expect(masks[8]).toEqual(BigInt(0b100000100000100000));
        //diagonals
        expect(masks[9]).toEqual(BigInt(0b000100000010000001));
        expect(masks[10]).toEqual(BigInt(0b001000010000100000));
    });
});

describe('Win Conditions', () => {
    it('Detects no win conditions on an empty board', () => {
        const board = createBoard();
        standardBoardLines.forEach((line) =>
            expect(
                hasLineCompletion(boardToBitset(board, 'blue'), line),
            ).toBeFalsy(),
        );
    });

    it('Correctly detects single rows', () => {
        const board = createBoard();
        board[0][0].completedPlayers = ['blue'];
        board[0][1].completedPlayers = ['blue'];
        board[0][2].completedPlayers = ['blue'];
        board[0][3].completedPlayers = ['blue'];
        board[0][4].completedPlayers = ['blue'];
        expect(countLines(board, 'blue')).toEqual(1);
        expect(countLines(board, 'red')).toEqual(0);
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
        expect(countLines(board, 'blue')).toEqual(1);
        expect(countLines(board, 'red')).toEqual(0);
        expect(countLines(board, 'green')).toEqual(0);
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
        expect(countLines(board, 'blue')).toEqual(2);
        expect(countLines(board, 'red')).toEqual(0);
        expect(countLines(board, 'green')).toEqual(0);
    });

    it('Correctly detects single columns', () => {
        const board = createBoard();
        board[0][0].completedPlayers = ['blue'];
        board[1][0].completedPlayers = ['blue'];
        board[2][0].completedPlayers = ['blue'];
        board[3][0].completedPlayers = ['blue'];
        board[4][0].completedPlayers = ['blue'];
        expect(countLines(board, 'blue')).toEqual(1);
        expect(countLines(board, 'red')).toEqual(0);
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
        expect(countLines(board, 'blue')).toEqual(1);
        expect(countLines(board, 'red')).toEqual(0);
        expect(countLines(board, 'green')).toEqual(0);
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
        expect(countLines(board, 'blue')).toEqual(2);
        expect(countLines(board, 'red')).toEqual(0);
        expect(countLines(board, 'green')).toEqual(0);
    });

    it('Correctly detects the main diagonal', () => {
        const board = createBoard();
        board[0][0].completedPlayers = ['blue'];
        board[1][1].completedPlayers = ['blue'];
        board[2][2].completedPlayers = ['blue'];
        board[3][3].completedPlayers = ['blue'];
        board[4][4].completedPlayers = ['blue'];
        expect(countLines(board, 'blue')).toEqual(1);
        expect(countLines(board, 'red')).toEqual(0);
    });

    it('Correctly detects the antiDiagonal', () => {
        const board = createBoard();
        board[0][4].completedPlayers = ['blue'];
        board[1][3].completedPlayers = ['blue'];
        board[2][2].completedPlayers = ['blue'];
        board[3][1].completedPlayers = ['blue'];
        board[4][0].completedPlayers = ['blue'];
        expect(countLines(board, 'blue')).toEqual(1);
        expect(countLines(board, 'red')).toEqual(0);
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
        expect(countLines(board, 'blue')).toEqual(2);
        expect(countLines(board, 'red')).toEqual(0);
        expect(countLines(board, 'green')).toEqual(2);
        expect(countLines(board, 'orange')).toEqual(0);
        expect(countLines(board, 'yellow')).toEqual(0);
    });
});
