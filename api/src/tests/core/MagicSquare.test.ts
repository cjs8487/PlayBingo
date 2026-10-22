import { generateMagicSquare } from '../../core/generation/layoutHelpers/MagicSquare';

const validateMagicSquare = (size: number, magicSquare: number[][]) => {
    const magicConstant = size * ((size ** 2 + 1) / 2);

    // rows
    for (let i = 0; i < size; i++) {
        let sum = 0;
        for (let j = 0; j < size; j++) {
            sum += magicSquare[i][j];
        }
        expect(sum).toBe(magicConstant);
    }

    // columns
    for (let col = 0; col < size; col++) {
        let sum = 0;
        for (let row = 0; row < size; row++) {
            sum += magicSquare[row][col];
        }
        expect(sum).toBe(magicConstant);
    }

    // main diagonal
    let sum = 0;
    for (let i = 0; i < size; i++) {
        sum += magicSquare[i][i];
    }
    expect(sum).toBe(magicConstant);

    // anti-diagonal
    sum = 0;
    for (let i = 0; i < size; i++) {
        sum += magicSquare[i][size - 1 - i];
    }
    expect(sum).toBe(magicConstant);
};

describe('Magic Square Generation', () => {
    it.each([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])(
        'Generates a valid magic square of size %i',
        (size) => {
            const magicSquare = generateMagicSquare(size);
            validateMagicSquare(size, magicSquare);
            const values = magicSquare.flat();
            expect(new Set(values).size).toBe(size * size);
            expect(Math.min(...values)).toBe(1);
            expect(Math.max(...values)).toBe(size * size);
        },
    );
});
