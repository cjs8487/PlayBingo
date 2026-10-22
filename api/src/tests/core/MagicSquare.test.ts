import { generateMagicSquare } from '../../core/generation/layoutHelpers/MagicSquare';

const validateMagicSquare = (size: number, magicSquare: number[][]) => {
    const magicConstant = size * ((size ** 2 + 1) / 2);
    for (let i = 0; i < size; i++) {
        let sum = 0;
        for (let j = 0; j < size; j++) {
            sum += magicSquare[i][j];
        }
        expect(sum).toBe(magicConstant);
    }
};

describe('Magic Square Generation', () => {
    it.each([3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20])(
        'Generates a valid magic square of size %i',
        (size) => {
            const magicSquare = generateMagicSquare(size, 0);
            validateMagicSquare(size, magicSquare);
            const magicConstant = size * ((size ** 2 + 1) / 2);
            for (let column = 0; column < size; column++) {
                expect(
                    magicSquare.reduce((sum, row) => sum + row[column], 0),
                ).toBe(magicConstant);
            }
            const values = magicSquare.flat();
            expect(new Set(values).size).toBe(size * size);
            expect(Math.min(...values)).toBe(1);
            expect(Math.max(...values)).toBe(size * size);
        },
    );
});
