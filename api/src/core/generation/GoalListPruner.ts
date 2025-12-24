import { GeneratorSettings } from '@playbingo/shared';
import { BoardGenerator } from './BoardGenerator';

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
        case 'tags-inclusion':
            return tagsInclusionFilter(filter.tags);
        case 'tags-exclusion':
            return tagsExclusionFilter(filter.tags);
        default:
            throw Error(`Unknown goal filter`);
    }
};

const categoryFilter =
    (categoryIds: string[]) => (generator: BoardGenerator) => {
        generator.goals = generator.goals.filter(
            (goal) =>
                goal.categories?.some((goalCat) =>
                    categoryIds.includes(goalCat.id),
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

const tagsInclusionFilter = (tags: string[]) => (generator: BoardGenerator) => {
    generator.goals = generator.goals.filter(
        (goal) =>
            goal.tags?.some((goalTag) => tags.includes(goalTag.id)) ?? false,
    );
};

const tagsExclusionFilter = (tags: string[]) => (generator: BoardGenerator) => {
    generator.goals = generator.goals.filter(
        (goal) =>
            !goal.tags ||
            goal.tags.length === 0 ||
            !(goal.tags.some((goalTag) => tags.includes(goalTag.id)) ?? false),
    );
};
