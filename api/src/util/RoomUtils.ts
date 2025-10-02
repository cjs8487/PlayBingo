import { Cell } from '@playbingo/types';
import { GeneratorGoal } from '../core/generation/GeneratorCore';
import { chunk } from './Array';
import { BingoMode } from '@prisma/client';

export const listToBoard = (list: GeneratorGoal[]): Cell[][] => {
    return chunk(
        list.map((g) => ({
            goal: g,
            completedPlayers: [],
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
