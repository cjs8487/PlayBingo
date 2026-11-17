import { BoardSizeOptions, GeneratorSettings } from '@playbingo/shared';

import { FilterableGoal, matchesGoalFilter } from './GoalListPruner';

export const MIN_BOARD_SIZE = 2;
export const MIN_MAGIC_SQUARE_SIZE = 3;
export const MAX_BOARD_SIZE = 15;
export const DEFAULT_BOARD_SIZE = 5;

export const isBoardSize = (size: unknown): size is number =>
    typeof size === 'number' &&
    Number.isInteger(size) &&
    size >= MIN_BOARD_SIZE &&
    size <= MAX_BOARD_SIZE;

const filteredGoals = (
    goals: readonly FilterableGoal[],
    settings: GeneratorSettings,
) =>
    goals.filter((goal) =>
        settings.goalFilters.every((filter) => matchesGoalFilter(goal, filter)),
    );

export const availableBoardSizes = (
    goals: readonly FilterableGoal[],
    settings: GeneratorSettings,
    traverse: boolean = false,
): number[] => {
    const layout = settings.boardLayout;
    const stepped =
        traverse && layout.mode !== 'random' && layout.mode !== 'custom';
    const eligible = filteredGoals(goals, settings).filter(
        (goal) =>
            !stepped ||
            (goal.difficulty != null && Number.isFinite(goal.difficulty)),
    );
    const difficulties = new Set(eligible.map((goal) => goal.difficulty));
    return Array.from({ length: 14 }, (_, i) => i + 2).filter((size) => {
        if (eligible.length < size ** 2) return false;
        if (stepped) return true;
        switch (layout.mode) {
            case 'srlv5':
                return (
                    size >= MIN_MAGIC_SQUARE_SIZE &&
                    Array.from({ length: size ** 2 }, (_, i) => i + 1).every(
                        (difficulty) => difficulties.has(difficulty),
                    )
                );
            case 'isaac':
                return size === 5;
            case 'custom':
                return (
                    layout.layout.length === size &&
                    layout.layout.every((row) => row.length === size)
                );
            case 'difficulty-distribution':
                return (
                    layout.distribution.reduce(
                        (sum, entry) => sum + entry.count,
                        0,
                    ) ===
                    size ** 2
                );
            case 'random':
                return true;
        }
    });
};

export const availableCustomBoardSize = (
    goals: readonly FilterableGoal[],
    settings: GeneratorSettings,
): BoardSizeOptions['customLayout'] => {
    if (settings.boardLayout.mode !== 'custom') return undefined;
    const layout = settings.boardLayout.layout;
    const height = layout.length;
    const width = layout[0]?.length ?? 0;
    if (
        width < 1 ||
        height < 1 ||
        width > MAX_BOARD_SIZE ||
        height > MAX_BOARD_SIZE ||
        layout.some((row) => row.length !== width) ||
        filteredGoals(goals, settings).length < width * height
    )
        return undefined;
    return { width, height };
};

export const difficultyVariantSizes = (
    goalCount: number,
    goalAmounts: number[],
): number[] =>
    goalCount >= 25 && goalAmounts.reduce((sum, count) => sum + count, 0) === 25
        ? [5]
        : [];
