import { chunk } from './Array';
import { GeneratorGoal } from '../core/generation/GeneratorCore';
import { Cell } from '../types/Cell';

export const listToBoard = (list: GeneratorGoal[]) => {
    return chunk(
        list.map((g) => ({
            goal: `${g.goal}`,
            description: g.description ?? '',
            colors: [],
        })),
        5,
    );
};

type CompletedLines = { [color: string]: number };

export const checkCompletedLines = (grid: Cell[][]): CompletedLines => {
    const numRows = grid.length;
    const numCols = grid[0]?.length || 0;
    const completedLines: CompletedLines = {};

    const allColors = new Set<string>();
    grid.forEach((row) =>
        row.forEach((cell) =>
            cell.colors.forEach((color) => allColors.add(color)),
        ),
    );

    const incrementLineCount = (lineColors: Set<string>) => {
        for (const color of lineColors) {
            completedLines[color] = (completedLines[color] || 0) + 1;
        }
    };

    // Check rows
    for (const row of grid) {
        const commonColors = new Set(row[0]?.colors || []);
        for (const cell of row) {
            for (const color of [...commonColors]) {
                if (!cell.colors.includes(color)) {
                    commonColors.delete(color);
                }
            }
        }
        incrementLineCount(commonColors);
    }

    // Check columns
    for (let col = 0; col < numCols; col++) {
        const commonColors = new Set(grid[0]?.[col]?.colors || []);
        for (let row = 0; row < numRows; row++) {
            const cell = grid[row][col];
            for (const color of commonColors) {
                if (!cell.colors.includes(color)) {
                    commonColors.delete(color);
                }
            }
        }
        incrementLineCount(commonColors);
    }

    // Check diagonals (top-left to bottom-right)
    if (numRows === numCols) {
        const mainDiagonalColors = new Set(grid[0]?.[0]?.colors || []);
        for (let i = 0; i < numRows; i++) {
            const cell = grid[i][i];
            for (const color of [...mainDiagonalColors]) {
                if (!cell.colors.includes(color)) {
                    mainDiagonalColors.delete(color);
                }
            }
        }
        incrementLineCount(mainDiagonalColors);

        // Check anti-diagonal (top-right to bottom-left)
        const antiDiagonalColors = new Set(
            grid[0]?.[numCols - 1]?.colors || [],
        );
        for (let i = 0; i < numRows; i++) {
            const cell = grid[i][numCols - 1 - i];
            for (const color of [...antiDiagonalColors]) {
                if (!cell.colors.includes(color)) {
                    antiDiagonalColors.delete(color);
                }
            }
        }
        incrementLineCount(antiDiagonalColors);
    }

    // Ensure all colors are included in the result
    allColors.forEach((color) => {
        if (!(color in completedLines)) {
            completedLines[color] = 0;
        }
    });

    return completedLines;
};
