import prand from 'pure-rand';

export const generateMagicSquare = (
    size: number,
    seed?: number,
): number[][] => {
    if (!Number.isInteger(size) || size < 3) {
        throw new Error(`Invalid size for a magic square (${size})`);
    }

    let magicSquare: number[][] = [];
    if (size % 2 == 1) {
        // odd size
        magicSquare = siamese(size);
    }
    // even size
    else if ((size - 2) % 4 === 0) {
        // 4n - 2
        magicSquare = strachey(size);
    } else if (size % 4 === 0) {
        // 4n
        magicSquare = doublyEven(size);
    } else {
        throw new Error(`Invalid size for a magic square (${size})`);
    }
    const rng = prand.xoroshiro128plus(
        seed ?? Math.ceil(999999 * Math.random()),
    );

    const half = Math.floor(size / 2);
    for (let x = 0; x < half; x++) {
        if (prand.unsafeUniformIntDistribution(0, 1, rng)) {
            const y = size - 1 - x;
            // Swap row x with row y
            const tempRow = magicSquare[x];
            magicSquare[x] = magicSquare[y];
            magicSquare[y] = tempRow;
            // Swap col x with col y
            for (let r = 0; r < size; r++) {
                const tempCol = magicSquare[r][x];
                magicSquare[r][x] = magicSquare[r][y];
                magicSquare[r][y] = tempCol;
            }
        }
    }

    const rotations = prand.unsafeUniformIntDistribution(0, 3, rng);
    for (let i = 0; i < rotations; i++) {
        magicSquare = magicSquare.map((_, row) =>
            magicSquare.map((line) => line[row]).reverse(),
        );
    }
    if (prand.unsafeUniformIntDistribution(0, 1, rng)) {
        magicSquare = magicSquare.map((row) => [...row].reverse());
    }
    if (prand.unsafeUniformIntDistribution(0, 1, rng)) {
        magicSquare = magicSquare.map((row) =>
            row.map((value) => size ** 2 + 1 - value),
        );
    }

    return magicSquare;
};

const siamese = (size: number): number[][] => {
    const magicSquare: number[][] = [];
    for (let i = 0; i < size; i++) {
        magicSquare[i] = [];
    }

    const mid = Math.floor(size / 2);
    magicSquare[0][mid] = 1;
    let x = mid,
        y = 0;
    for (let i = 1; i <= size ** 2; i++) {
        if (x >= size) {
            x = 0;
        }
        if (y < 0) {
            y = size - 1;
        }
        magicSquare[y][x] = i;
        if (i % size == 0) {
            y++;
        } else {
            x++;
            y--;
        }
    }
    return magicSquare;
};

const strachey = (size: number): number[][] => {
    const magicSquare: number[][] = [];
    for (let i = 0; i < size; i++) {
        magicSquare[i] = [];
    }

    const subsquareSize = size / 2;
    const k = (size - 2) / 4;

    const subsquareA = siamese(subsquareSize);
    const subsquareB: number[][] = [];
    const subsquareC: number[][] = [];
    const subsquareD: number[][] = [];
    for (let i = 0; i < size; i++) {
        subsquareB[i] = [];
        subsquareC[i] = [];
        subsquareD[i] = [];
    }

    // adjust b, c, and d
    for (let i = 0; i < subsquareSize; i++) {
        for (let j = 0; j < subsquareSize; j++) {
            subsquareB[i][j] = subsquareA[i][j] + subsquareSize ** 2;
            subsquareC[i][j] = subsquareB[i][j] + subsquareSize ** 2;
            subsquareD[i][j] = subsquareC[i][j] + subsquareSize ** 2;
        }
    }

    //swap leftmost k columns in A with D
    for (let i = 0; i < subsquareSize; i++) {
        for (let j = 0; j < k; j++) {
            const temp = subsquareA[i][j];
            subsquareA[i][j] = subsquareD[i][j];
            subsquareD[i][j] = temp;
        }
    }

    // swap rightmost k - 1 columns in C with B
    for (let i = 0; i < subsquareSize; i++) {
        for (let j = subsquareSize - 1; j > subsquareSize - k; j--) {
            const temp = subsquareC[i][j];
            subsquareC[i][j] = subsquareB[i][j];
            subsquareB[i][j] = temp;
        }
    }

    // cell swaps
    // leftmost middle cell in A and D
    const middle = Math.floor(subsquareSize / 2);
    let temp = subsquareA[middle][0];
    subsquareA[middle][0] = subsquareD[middle][0];
    subsquareD[middle][0] = temp;
    // central cell in A and D
    temp = subsquareA[middle][middle];
    subsquareA[middle][middle] = subsquareD[middle][middle];
    subsquareD[middle][middle] = temp;

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            if (y < subsquareSize && x < subsquareSize) {
                magicSquare[y][x] = subsquareA[y][x];
            } else if (y < subsquareSize && x >= subsquareSize) {
                magicSquare[y][x] = subsquareC[y][x - subsquareSize];
            } else if (y >= subsquareSize && x < subsquareSize) {
                magicSquare[y][x] = subsquareD[y - subsquareSize][x];
            } else if (y >= subsquareSize && x >= subsquareSize) {
                magicSquare[y][x] =
                    subsquareB[y - subsquareSize][x - subsquareSize];
            }
        }
    }

    return magicSquare;
};

const doublyEven = (size: number) => {
    const magicSquare: number[][] = [];
    const complement = size * size + 1;
    for (let i = 0; i < size; i++) {
        magicSquare[i] = [];
        const blockRow = i % 4;
        for (let j = 0; j < size; j++) {
            const val = i * size + j + 1;
            const blockColumn = j % 4;
            magicSquare[i][j] =
                blockRow === blockColumn || blockRow + blockColumn === 3
                    ? val
                    : complement - val;
        }
    }

    return magicSquare;
};
