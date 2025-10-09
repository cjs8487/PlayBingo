import { Goal } from '@playbingo/types';
import BoardGenerator from './BoardGenerator';
import { GeneratorSettings } from '@playbingo/shared';

type GoalFilter = GeneratorSettings['goalFilters'][number];

export type GoalListPruner = (generator: BoardGenerator) => void;

export const createPruner = (filter: GoalFilter) => {
    switch (filter.mode) {
        case 'category':
            return categoryFilter(filter.categories);
        case 'difficulty':
            return difficultyFilter(
                filter.min ?? 0,
                filter.max ?? Number.MAX_VALUE,
            );
        default:
            throw Error(`Unknown goal filter`);
    }
};

const categoryFilter =
    (categories: string[]) => (generator: BoardGenerator) => {
        generator.goals = generator.goals.filter(
            (goal) =>
                goal.categories?.some((goalCat) =>
                    categories.includes(goalCat),
                ) ?? false,
        );
    };

const difficultyFilter =
    (min: number, max: number) => (generator: BoardGenerator) => {
        generator.goals = generator.goals.filter(
            (goal) =>
                !!goal.difficulty &&
                goal.difficulty >= min &&
                goal.difficulty <= max,
        );
    };
