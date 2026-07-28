import { generateMagicSquare } from '../../core/generation/layoutHelpers/MagicSquare';

const validateMagicSquare = (size: number, magicSquare: number[][]) => {
    const mogicConstant = size * ((size ** 2 + 1) / 2);
    for (let i = 0; i < size; i++) {
        let sum = 0;
        for (let j = 0; j < size; j++) {
            sum += magicSquare[i][j];
        }
        expect(sum).toBe(mogicConstant);
    }
};

describe('Magic Square Generation', () => {
    it('Generates a valid magic square of size 3', () => {
        const magicSquare = generateMagicSquare(3);
        validateMagicSquare(3, magicSquare);
    });
    it('Generates a valid magic square of size 4', () => {
        const magicSquare = generateMagicSquare(4);
        validateMagicSquare(4, magicSquare);
    });
    it('Generates a valid magic square of size 5', () => {
        const magicSquare = generateMagicSquare(5);
        validateMagicSquare(5, magicSquare);
        console.log(magicSquare.map((row) => row.join(' ')).join('\n'));
    });
    it('Generates a valid magic square of size 6', () => {
        const magicSquare = generateMagicSquare(6);
        validateMagicSquare(6, magicSquare);
    });
    it('Generates a valid magic square of size 7', () => {
        const magicSquare = generateMagicSquare(7);
        validateMagicSquare(7, magicSquare);
    });
    // TODO: MAKE DOUBLY EVEN APPROACH FULLY GENERIC
    // it('Generates a valid magic square of size 8', () => {
    //     const magicSquare = generateMagicSquare(8, 0);
    //     validateMagicSquare(8, magicSquare);
    // });
    it('Generates a valid magic square of size 9', () => {
        const magicSquare = generateMagicSquare(9);
        validateMagicSquare(9, magicSquare);
    });
    it('Generates a valid magic square of size 10', () => {
        const magicSquare = generateMagicSquare(10);
        validateMagicSquare(10, magicSquare);
    });
});
