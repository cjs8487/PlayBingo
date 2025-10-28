import { RevealedCell } from '@playbingo/types';
import { GeneratorGoal } from '../core/generation/GeneratorCore';
import { chunk } from './Array';

export const listToBoard = (list: GeneratorGoal[]): RevealedCell[][] => {
    return chunk(
        list.map((g) => ({
            goal: g,
            completedPlayers: [],
            revealed: true,
        })),
        5,
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
