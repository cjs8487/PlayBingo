import { Cell } from '@playbingo/types';
import { GeneratorGoal } from '../core/generation/GeneratorCore';
import { chunk } from './Array';

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

export type CompletedLines = { [color: string]: number };

export const checkCompletedLines = (grid: Cell[][]): CompletedLines => {
    const numRows = grid.length;
    const numCols = grid[0]?.length || 0;
    const completedLines: CompletedLines = {};

    const allPlayers = new Set<string>();
    grid.forEach((row) =>
        row.forEach((cell) =>
            cell.completedPlayers.forEach((player) => allPlayers.add(player)),
        ),
    );

    const incrementLineCount = (linePlayers: Set<string>) => {
        for (const player of linePlayers) {
            completedLines[player] = (completedLines[player] || 0) + 1;
        }
    };

    // Check rows
    for (const row of grid) {
        const commonPlayers = new Set(row[0]?.completedPlayers || []);
        for (const cell of row) {
            for (const player of [...commonPlayers]) {
                if (!cell.completedPlayers.includes(player)) {
                    commonPlayers.delete(player);
                }
            }
        }
        incrementLineCount(commonPlayers);
    }

    // Check columns
    for (let col = 0; col < numCols; col++) {
        const commonColors = new Set(grid[0]?.[col]?.completedPlayers || []);
        for (let row = 0; row < numRows; row++) {
            const cell = grid[row][col];
            for (const player of commonColors) {
                if (!cell.completedPlayers.includes(player)) {
                    commonColors.delete(player);
                }
            }
        }
        incrementLineCount(commonColors);
    }

    // Check diagonals (top-left to bottom-right)
    if (numRows === numCols) {
        const mainDiagonalPlayers = new Set(
            grid[0]?.[0]?.completedPlayers || [],
        );
        for (let i = 0; i < numRows; i++) {
            const cell = grid[i][i];
            for (const player of [...mainDiagonalPlayers]) {
                if (!cell.completedPlayers.includes(player)) {
                    mainDiagonalPlayers.delete(player);
                }
            }
        }
        incrementLineCount(mainDiagonalPlayers);

        // Check anti-diagonal (top-right to bottom-left)
        const antiDiagonalPlayers = new Set(
            grid[0]?.[numCols - 1]?.completedPlayers || [],
        );
        for (let i = 0; i < numRows; i++) {
            const cell = grid[i][numCols - 1 - i];
            for (const player of [...antiDiagonalPlayers]) {
                if (!cell.completedPlayers.includes(player)) {
                    antiDiagonalPlayers.delete(player);
                }
            }
        }
        incrementLineCount(antiDiagonalPlayers);
    }

    // Ensure all colors are included in the result
    allPlayers.forEach((color) => {
        if (!(color in completedLines)) {
            completedLines[color] = 0;
        }
    });

    return completedLines;
};
