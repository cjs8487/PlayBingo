import { GeneratorSettings } from '@playbingo/shared';
import { BoardGenerator } from './BoardGenerator';

type GoalFilter = GeneratorSettings['goalFilters'][number];

export type FilterableGoal = {
    difficulty: number | null;
    categories: readonly { id: string }[];
    tags: readonly { id: string }[];
};

export const matchesGoalFilter = (goal: FilterableGoal, filter: GoalFilter) => {
    switch (filter.mode) {
        case 'category':
            return goal.categories.some((category) =>
                filter.categories.includes(category.id),
            );
        case 'difficulty':
            return (
                !!goal.difficulty &&
                goal.difficulty >= (filter.min ?? 0) &&
                goal.difficulty <= (filter.max ?? Number.MAX_VALUE)
            );
        case 'tags-inclusion':
            return goal.tags.some((tag) => filter.tags.includes(tag.id));
        case 'tags-exclusion':
            return !goal.tags.some((tag) => filter.tags.includes(tag.id));
        default:
            throw Error('Unknown goal filter');
    }
};

export type GoalListPruner = (generator: BoardGenerator) => void;

export const createPruner =
    (filter: GoalFilter): GoalListPruner =>
    (generator) => {
        generator.goals = generator.goals.filter((goal) =>
            matchesGoalFilter(goal, filter),
        );
    };
