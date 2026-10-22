import { GeneratorSettings, makeGeneratorSchema } from '@playbingo/shared';
import {
    availableBoardSizes,
    availableCustomBoardSize,
} from '../../core/generation/BoardSizes';
import { GeneratorGoal } from '../../core/generation/GeneratorCore';

const goals: GeneratorGoal[] = Array.from({ length: 225 }, (_, i) => ({
    id: String(i),
    goal: `Goal ${i}`,
    difficulty: i + 1,
    description: '',
    categories: [],
    tags: [],
    meta: {},
    goalImageId: null,
    secondaryGoalImageId: null,
    goalImageTagId: null,
    count: null,
}));
const settings = (
    boardLayout: GeneratorSettings['boardLayout'],
): GeneratorSettings => ({
    goalFilters: [],
    goalTransformation: [],
    boardLayout,
    restrictions: [],
    adjustments: [],
});

const filterGoals = goals.slice(0, 100).map((goal, i) => ({
    ...goal,
    categories: [{ id: i < 9 ? 'included' : 'excluded' }],
    tags: [{ id: i < 9 ? 'included' : 'excluded' }],
}));

it.each<GeneratorSettings['goalFilters'][number]>([
    { mode: 'category', categories: ['included'] },
    { mode: 'tags-inclusion', tags: ['included'] },
    { mode: 'tags-exclusion', tags: ['excluded'] },
])('counts only goals passing $mode filters', (filter) => {
    const config = settings({ mode: 'random' });
    config.goalFilters = [filter];
    expect(availableBoardSizes(filterGoals, config)).toEqual([2, 3]);
});

it('combines filters before counting goals and checking difficulty coverage', () => {
    const config = settings({ mode: 'random' });
    config.goalFilters = [
        { mode: 'category', categories: ['included'] },
        { mode: 'tags-exclusion', tags: ['blocked'] },
        { mode: 'difficulty', min: 2 },
    ];
    const supply = filterGoals.map((goal, i) => ({
        ...goal,
        tags: i === 8 ? [{ id: 'blocked' }] : goal.tags,
    }));
    expect(availableBoardSizes(supply, config)).toEqual([2]);
    config.boardLayout = { mode: 'srlv5' };
    expect(availableBoardSizes(supply, config)).toEqual([]);
});

it('requires sufficient filtered goals for a rectangular custom layout', () => {
    const config = settings({
        mode: 'custom',
        layout: Array.from({ length: 2 }, () =>
            Array.from({ length: 5 }, () => ({
                selectionCriteria: 'random' as const,
            })),
        ),
    });
    expect(availableCustomBoardSize(filterGoals, config)).toEqual({
        width: 5,
        height: 2,
    });
    config.goalFilters = [{ mode: 'tags-inclusion', tags: ['included'] }];
    expect(availableCustomBoardSize(filterGoals, config)).toBeUndefined();
});

it('checks magic-square difficulty coverage after tag filtering', () => {
    const config = settings({ mode: 'srlv5' });
    config.goalFilters = [{ mode: 'tags-exclusion', tags: ['blocked'] }];
    const supply = filterGoals.map((goal, i) => ({
        ...goal,
        tags: i === 0 ? [{ id: 'blocked' }] : [],
    }));
    expect(availableBoardSizes(supply, config)).toEqual([]);
});

it('offers only sizes with sufficient goals, including small games', () => {
    expect(
        availableBoardSizes(goals.slice(0, 3), settings({ mode: 'random' })),
    ).toEqual([]);
    expect(
        availableBoardSizes(goals.slice(0, 4), settings({ mode: 'random' })),
    ).toEqual([2]);
    expect(
        availableBoardSizes(goals.slice(0, 24), settings({ mode: 'random' })),
    ).toEqual([2, 3, 4]);
    expect(availableBoardSizes(goals, settings({ mode: 'random' }))).toEqual(
        Array.from({ length: 14 }, (_, i) => i + 2),
    );
});

it('counts goals within numeric difficulty bounds', () => {
    const config = settings({ mode: 'random' });
    config.goalFilters = [{ mode: 'difficulty', max: 9 }];
    expect(availableBoardSizes(goals, config)).toEqual([2, 3]);
});

it('requires every difficulty from 1 through n squared for magic squares', () => {
    expect(availableBoardSizes(goals, settings({ mode: 'srlv5' }))).toEqual(
        Array.from({ length: 13 }, (_, i) => i + 3),
    );
    expect(
        availableBoardSizes(
            goals.filter((goal) => goal.difficulty !== 16),
            settings({ mode: 'srlv5' }),
        ),
    ).toEqual([3]);
    expect(
        availableBoardSizes(
            goals.filter((goal) => goal.difficulty !== 1),
            settings({ mode: 'srlv5' }),
        ),
    ).toEqual([]);
});

it('limits the Isaac layout to 5x5 without checking individual cells', () => {
    const isaacGoals = goals.map((goal, i) => ({
        ...goal,
        difficulty: (i % 4) + 1,
    }));
    expect(
        availableBoardSizes(isaacGoals, settings({ mode: 'isaac' })),
    ).toEqual([5]);
    expect(
        availableBoardSizes(
            isaacGoals.filter((goal) => goal.difficulty !== 4),
            settings({ mode: 'isaac' }),
        ),
    ).toEqual([5]);
});

it('offers only the exact square size of a custom layout', () => {
    const layout = Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => ({
            selectionCriteria: 'random' as const,
        })),
    );
    expect(
        availableBoardSizes(goals, settings({ mode: 'custom', layout })),
    ).toEqual([3]);
    expect(
        availableBoardSizes(
            goals,
            settings({ mode: 'custom', layout: layout.slice(1) }),
        ),
    ).toEqual([]);
});

it('uses distribution cell counts without checking difficulty placement', () => {
    expect(
        availableBoardSizes(
            goals,
            settings({
                mode: 'difficulty-distribution',
                distribution: [{ difficulty: 1, count: 4 }],
            }),
        ),
    ).toEqual([2]);
    const supply = goals.map((goal) => ({ ...goal, difficulty: 1 }));
    expect(
        availableBoardSizes(
            supply,
            settings({
                mode: 'difficulty-distribution',
                distribution: [{ difficulty: 1, count: 9 }],
            }),
        ),
    ).toEqual([3]);
});

it('validates rectangular custom layouts and square difficulty distributions', () => {
    const { schema } = makeGeneratorSchema([], goals, []);
    expect(
        schema.safeParse(
            settings({
                mode: 'custom',
                layout: [[{ selectionCriteria: 'random' }]],
            }),
        ).success,
    ).toBe(true);
    expect(
        schema.safeParse(
            settings({
                mode: 'difficulty-distribution',
                distribution: [{ difficulty: 1, count: 225 }],
            }),
        ).success,
    ).toBe(true);
    expect(
        schema.safeParse(
            settings({
                mode: 'difficulty-distribution',
                distribution: [{ difficulty: 1, count: 26 }],
            }),
        ).success,
    ).toBe(false);
});
