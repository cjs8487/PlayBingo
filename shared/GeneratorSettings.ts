import { Goal, GoalCategory, GoalTag } from '@playbingo/types';
import * as z from 'zod';

declare module 'zod' {
    interface GlobalMeta {
        enumMeta?: Record<string, { label: string; description?: string }>;
        displayDetails?: {
            row?: boolean;
        };
    }
}

export const makeGeneratorSchema = (
    categories: GoalCategory[],
    goals: Goal[],
    tags: GoalTag[],
) => {
    z.globalRegistry.clear();

    const catIds = categories.map((c) => c.id);
    const goalIds = goals.map((g) => g.id);
    const tagIds = tags.map((t) => t.id);

    const GoalFilterSchema = z.discriminatedUnion('mode', [
        z
            .object({
                mode: z.literal('difficulty').meta({
                    title: 'Difficulty',
                    description:
                        'Filters out goals with a difficulty lower than the minimum or higher than the maximum. Goals with no difficulty are always filtered out when this filter is active.',
                }),
                min: z
                    .number()
                    .int()
                    .min(1, 'Minimum must be at least 1')
                    .optional()
                    .meta({ title: 'Minimum Difficulty' }),
                max: z
                    .number()
                    .int()
                    .min(1, 'Maximum must be at least 1')
                    .optional()
                    .meta({ title: 'Maximum Difficulty' }),
            })
            .refine(({ min, max }) => !min || !max || min <= max, {
                error: 'Minimum must be less than maximum',
            })
            .refine(({ min, max }) => min || max, {
                error: 'At least one of minimum or maximum must be set',
            }),
        z.object({
            mode: z.literal('category').meta({
                title: 'Category',
                description:
                    'Filters goals based on categories. Goals that do not match any of the categories in this filter are filtered out. Goals must only match a single category to pass the filter. Goals with no categories always fail this filter.',
            }),
            categories: z
                .array(
                    z.enum(catIds).meta({
                        enumMeta: Object.fromEntries(
                            categories.map((cat) => [
                                cat.id,
                                { label: cat.name },
                            ]),
                        ),
                    }),
                )
                .refine((arr) => new Set(arr).size === arr.length, {
                    error: 'Duplicate categories are not allowed',
                })
                .meta({ title: 'Categories' }),
        }),
        z.object({
            mode: z.literal('tags-inclusion').meta({
                title: 'Include Tags',
                description:
                    'Filters goals based on tags. Only goals that have at least one of the tags in this filter are included. Goals with no tags will always fail this filter.',
            }),
            tags: z
                .array(
                    z.enum(tagIds).meta({
                        enumMeta: Object.fromEntries(
                            tags.map((tag) => [tag.id, { label: tag.name }]),
                        ),
                    }),
                )
                .refine((arr) => new Set(arr).size === arr.length, {
                    error: 'Duplicate tags are not allowed',
                })
                .meta({ title: 'Tags' }),
        }),
        z.object({
            mode: z.literal('tags-exclusion').meta({
                title: 'Exclude Tags',
                description:
                    'Filters goals based on tags. Goals that have at least one of the tags in this filter are filtered out. Goals with no tags will always pass this filter.',
            }),
            tags: z
                .array(
                    z.enum(tagIds).meta({
                        enumMeta: Object.fromEntries(
                            tags.map((tag) => [tag.id, { label: tag.name }]),
                        ),
                    }),
                )
                .refine((arr) => new Set(arr).size === arr.length, {
                    error: 'Duplicate tags are not allowed',
                })
                .meta({ title: 'Tags' }),
        }),
    ]);

    const GoalTransformationSchema = z.discriminatedUnion('mode', [
        z.object({ mode: z.literal('none') }).meta({ title: 'None' }),
    ]);

    const GenerationBoardLayoutSchema = z.discriminatedUnion('mode', [
        z.object({
            mode: z.literal('random').meta({
                title: 'Random',
                description:
                    'Generates a board layout that has no restrictions on what goals can be placed in any given cell',
            }),
        }),
        z.object({
            mode: z.literal('srlv5').meta({
                title: 'SRLv5',
                description:
                    'Generates a 5x5 board using difficulties 1-25 to balance each line. Each difficulty appears on the board exactly once amd the sum of the difficulties in each line sums to the same value. Goals with an invalid difficulty will be ignored.',
            }),
        }),
        z.object({
            mode: z.literal('isaac').meta({
                title: 'Static (Isaac)',
                description:
                    'Generates a 5x5 board with a static layout using difficulties 1-4. The center cell of the board is always 4, and all sum of difficulties in lines including the center cell is 10. All other lines have a difficulty sum of 9. Goals with an invalid difficulty will be ignored.',
            }),
        }),
        z.object({
            mode: z.literal('custom').meta({
                title: 'Custom',
                description:
                    'Generates a board with a custom layout. Custom layouts have no restriction on the size of the board, but must be able fill every cell with at least one goal from the pool. Goals with an invalid value based on the selection criteria for the cell will be ignored when placing a goal in that cell. ',
            }),
            layout: z
                .array(
                    z
                        .array(
                            z
                                .discriminatedUnion('selectionCriteria', [
                                    z
                                        .object({
                                            selectionCriteria:
                                                z.literal('difficulty'),
                                            difficulty: z
                                                .number()
                                                .int()
                                                .min(
                                                    1,
                                                    'Value must be at least 1',
                                                ),
                                        })
                                        .meta({ title: 'Difficulty' }),
                                    z
                                        .object({
                                            selectionCriteria:
                                                z.literal('category'),
                                            category: z.enum(catIds).meta({
                                                enumMeta: Object.fromEntries(
                                                    categories.map((cat) => [
                                                        cat.id,
                                                        { label: cat.name },
                                                    ]),
                                                ),
                                            }),
                                        })
                                        .meta({ title: 'Category' }),
                                    z
                                        .object({
                                            selectionCriteria:
                                                z.literal('fixed'),
                                            goal: z.enum(goalIds).meta({
                                                enumMeta: Object.fromEntries(
                                                    goals.map((goal) => [
                                                        goal.id,
                                                        { label: goal.goal },
                                                    ]),
                                                ),
                                            }),
                                        })
                                        .meta({
                                            title: 'Fixed',
                                        }),
                                    z
                                        .object({
                                            selectionCriteria:
                                                z.literal('random'),
                                        })
                                        .meta({ title: 'Random' }),
                                ])
                                .default({ selectionCriteria: 'random' }),
                        )
                        .min(1, 'Rows must contain at least 1 cell.')
                        .max(
                            15,
                            '15x15 is the maximum supported size on PlayBingo',
                        )
                        .default([{ selectionCriteria: 'random' }]),
                )
                .min(1, 'Layout must have at least one row')
                .max(15, '15x15 is the maximum supported board size')
                .refine(
                    (arr) => arr.every((row) => row.length === arr[0].length),
                    { error: 'All rows must be the same length' },
                )
                .meta({ title: 'Layout' })
                .default([[{ selectionCriteria: 'random' }]]),
        }),
    ]);

    const GenerationGoalRestrictionSchema = z.discriminatedUnion('type', [
        z.object({
            type: z.literal('line-type-exclusion').meta({
                title: 'Line Type Exclusion',
                description:
                    'Utilizes goal categories to minimize the synergy in each line by minimizing the total overlap of categories in the line. With this restriction, a goal with the minimum possible overlap will be placed in each cell.',
            }),
        }),
    ]);

    const GenerationGlobalAdjustmentsSchema = z.discriminatedUnion('type', [
        z.object({
            type: z.literal('synergize').meta({
                title: 'Synergize',
                description:
                    'Increases the likelihood of a goal sharing one or more types with already placed goals being selected. After a goal is selected, the remaining goals that share a type are duplicated, resulting in a 2x chance of selection. Goals which share multiple categories will have an even higher chance of selection.',
            }),
        }),
        z.object({
            type: z.literal('board-type-max').meta({
                title: 'Category Maximums',
                description:
                    'Constrains the board to having a maximum number of goals with any given type. After a goal is placed, if any of its types have met its maximum, all goals with that category will be removed from the goal pool, preventing any more from being placed.',
            }),
        }),
    ]);

    return {
        schema: z.object({
            goalFilters: z
                .array(GoalFilterSchema)
                .default([])
                .refine(
                    (arr) => {
                        return (
                            new Set(arr.map((filter) => filter.mode)).size ===
                            arr.length
                        );
                    },
                    { error: 'Duplicate filter types not allowed' },
                )
                .meta({
                    title: 'Goal Filters',
                    description:
                        'Goal filters allow the generator to remove goals that meet specific criteria from the generation pool before generation starts. By default, the generator will pull from all goals available to the game',
                }),
            goalTransformation: z
                .array(GoalTransformationSchema)
                .default([])
                .refine(
                    (arr) => {
                        return (
                            new Set(arr.map((transform) => transform.mode))
                                .size === arr.length
                        );
                    },
                    { error: 'Duplicate transformations not allowed' },
                )
                .meta({
                    title: 'Goal Transformation',
                    description:
                        'Alters the data for each goal before generation. Currently, no options are available for this generation step and the generator will use the base values for all goals.',
                }),
            boardLayout: GenerationBoardLayoutSchema.default({
                mode: 'random',
            }).meta({
                title: 'Board Layout',
                description:
                    'Determines how goals are laid out on the bingo board and how they are placed..',
            }),
            restrictions: z
                .array(GenerationGoalRestrictionSchema)
                .default([])
                .refine(
                    (arr) => {
                        return (
                            new Set(arr.map((restriction) => restriction.type))
                                .size === arr.length
                        );
                    },
                    { error: 'Duplicate restrictions not allowed' },
                )
                .meta({
                    title: 'Cell Restrictions',
                    description:
                        'Applies additional restrictions on cells, which prevents the placement of otherwise valid goals in the cell.',
                }),
            adjustments: z
                .array(GenerationGlobalAdjustmentsSchema)
                .default([])
                .refine(
                    (arr) => {
                        return (
                            new Set(arr.map((adjustment) => adjustment.type))
                                .size === arr.length
                        );
                    },
                    { error: 'Duplicate adjustments not allowed' },
                )
                .meta({
                    title: 'Global Adjustments',
                    description:
                        'Applies modifications after a goal is selected and placed in the board, which may affect the placement of future goals.',
                }),
        }),
        metadata: z.globalRegistry,
    };
};

export type GeneratorSettings = z.infer<
    ReturnType<typeof makeGeneratorSchema>['schema']
>;
