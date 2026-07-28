import prand from 'pure-rand';

export const generateMagicSquare = (
    size: number,
    seed?: number,
): number[][] => {
    if (size < 3) {
        return [];
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
        throw new Error(`Invalid size for a magic sqaure (${size})`);
    }

    // randomized transformations
    const rng = prand.xoroshiro128plus(seed ?? 999999 * Math.random());
    const numInterchanges = prand.unsafeUniformIntDistribution(0, 20, rng);

    for (let i = 0; i < numInterchanges; i++) {
        let x = prand.unsafeUniformIntDistribution(0, size - 1, rng);
        let y = prand.unsafeUniformIntDistribution(0, size - 1, rng);

        // must be a non central row or column
        if (size % 2 == 1) {
            while (x == Math.floor(size / 2)) {
                x = prand.unsafeUniformIntDistribution(0, size - 1, rng);
            }
            while (y == Math.floor(size / 2)) {
                y = prand.unsafeUniformIntDistribution(0, size - 1, rng);
            }
        }

        const temp = magicSquare[y];
        magicSquare[y] = magicSquare[x];
        magicSquare[x] = temp;

        for (let j = 0; j < size; j++) {
            const temp = magicSquare[j][x];
            magicSquare[j][x] = magicSquare[j][y];
            magicSquare[j][y] = temp;
        }
    }

    return magicSquare;
};

const siamese = (size: number): number[][] => {
    const magicSquare: number[][] = [];
    for (let i = 0; i < size; i++) {
        magicSquare[i] = [];
    }

    const mid = Math.floor(size / 2);
    magicSquare[mid][0] = 1;
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
    for (let i = 0; i < size; i++) {
        magicSquare[i] = [];
    }

    const placed: number[] = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const val = i * size + j + 1;
            if (i == j) {
                magicSquare[i][j] = val;
                placed.push(val);
            } else if (i == size - j - 1) {
                magicSquare[i][j] = val;
                placed.push(val);
            }
        }
    }

    let i = 1;
    for (let y = size - 1; y >= 0; y--) {
        for (let x = size - 1; x >= 0; x--) {
            if (!magicSquare[y][x]) {
                magicSquare[y][x] = i;
            }
            i++;
        }
    }

    return magicSquare;
};
