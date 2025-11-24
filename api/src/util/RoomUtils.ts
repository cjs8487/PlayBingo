import { RevealedCell } from '@playbingo/types';
import { GeneratorGoal } from '../core/generation/GeneratorCore';
import { chunk } from './Array';
import { BingoMode } from '@prisma/client';

export const listToBoard = (
    list: GeneratorGoal[],
    length: number,
): RevealedCell[][] => {
    return chunk(
        list.map((g) => ({
            goal: g,
            completedPlayers: [],
            revealed: true,
        })),
        length,
    );
};

export const computeLineMasks = (rows: number, cols: number): bigint[] => {
    const masks: bigint[] = [];

    // rows
    for (let r = 0; r < rows; r++) {
        let mask = 0n;
        for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            mask |= 1n << BigInt(idx);
        }
        masks.push(mask);
    }

    // cols
    for (let c = 0; c < cols; c++) {
        let mask = 0n;
        for (let r = 0; r < rows; r++) {
            const idx = r * cols + c;
            mask |= 1n << BigInt(idx);
        }
        masks.push(mask);
    }

    let mainDiag = 0n;
    for (let i = 0; i < Math.min(rows, cols); i++) {
        const idx = i * cols + i;
        mainDiag |= 1n << BigInt(idx);
    }
    masks.push(mainDiag);

    let antiDiag = 0n;
    for (let i = 0; i < Math.min(rows, cols); i++) {
        const idx = i * cols + (cols - 1 - i);
        antiDiag |= 1n << BigInt(idx);
    }
    masks.push(antiDiag);

    return masks;
};

export const hasLineCompletion = (
    bitset: bigint,
    lineMask: bigint,
): boolean => {
    return (bitset & lineMask) === lineMask;
};

export const getModeString = (mode: BingoMode, lineCount: number): string => {
    switch (mode) {
        case BingoMode.LINES:
            if (lineCount === 1) {
                return 'Single Bingo';
            } else if (lineCount === 2) {
                return 'Double Bingo';
            } else if (lineCount === 3) {
                return 'Triple Bingo';
            } else if (lineCount === 4) {
                return 'Quad Bingo';
            } else if (lineCount === 5) {
                return 'Cinco Bingo';
            } else {
                return `${lineCount}-Line Bingo`;
            }
        case BingoMode.BLACKOUT:
            return 'Blackout';
        case BingoMode.LOCKOUT:
            return 'Lockout';
        default:
            return 'Unknown Mode';
    }
};

export const rowColToBitIndex = (
    row: number,
    col: number,
    cols: number,
): number => {
    return row * cols + col;
};

export const rowColToMask = (
    row: number,
    col: number,
    cols: number,
): bigint => {
    return 1n << BigInt(rowColToBitIndex(row, col, cols));
};

export function computeRevealedMask(
    markedMask: bigint,
    width: number,
    height: number,
): bigint {
    const total = BigInt(width * height);
    const allMask = (1n << total) - 1n;

    // Mask for leftmost column bits
    let leftMask = 0n;
    for (let r = 0; r < height; r++) {
        leftMask |= 1n << BigInt(r * width);
    }

    // Mask for rightmost column bits
    let rightMask = 0n;
    for (let r = 0; r < height; r++) {
        rightMask |= 1n << BigInt(r * width + (width - 1));
    }

    // Shift up/down by width rows
    const up = (markedMask >> BigInt(width)) & allMask;
    const down = (markedMask << BigInt(width)) & allMask;

    // Shift left/right by 1 column, masking to avoid wrapping
    const left = (markedMask >> 1n) & ~rightMask & allMask;
    const right = (markedMask << 1n) & ~leftMask & allMask;

    // Combine all directions + self
    return (markedMask | up | down | left | right) & allMask;
}
