import { BoardSizeOptions, GeneratorSettings } from '@playbingo/shared';

import { FilterableGoal, matchesGoalFilter } from './GoalListPruner';

export const isBoardSize = (size: unknown): size is number =>
    typeof size === 'number' &&
    Number.isInteger(size) &&
    size >= 2 &&
    size <= 15;

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
): number[] => {
    const eligible = filteredGoals(goals, settings);
    const difficulties = new Set(eligible.map((goal) => goal.difficulty));
    const layout = settings.boardLayout;
    return Array.from({ length: 14 }, (_, i) => i + 2).filter((size) => {
        if (eligible.length < size ** 2) return false;
        switch (layout.mode) {
            case 'srlv5':
                return (
                    size >= 3 &&
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
        width > 15 ||
        height > 15 ||
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
