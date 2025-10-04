import { GoalCategory } from '@playbingo/types';
import * as z from 'zod';

declare module 'zod' {
    interface GlobalMeta {
        enumMeta?: Record<string, { label: string; description?: string }>;
    }
}

export const makeGeneratorSchema = (categories: GoalCategory[]) => {
    z.globalRegistry.clear();

    const catIds = categories.map((c) => c.id);

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
    ]);

    const GoalTransformationSchema = z.discriminatedUnion('mode', [
        z.object({ mode: z.literal('none') }),
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
                    'Generates a board using difficulties 1-25 to balance each line. Each difficulty appears on the board exactly once amd the sum of the difficulties in each line sums to the same value. Goals with an invalid difficulty will be ignored.',
            }),
        }),
        z.object({
            mode: z.literal('isaac').meta({
                title: 'Static (Isaac)',
                description:
                    'Generates a board with a static layout using difficulties 1-4. The center cell of the board is always 4, and all sum of difficulties in lines including the center cell is 10. All other lines have a difficulty sum of 9. Goals with an invalid difficulty will be ignored.',
            }),
        }),
    ]);

    const GenerationGoalSelectionSchema = z.discriminatedUnion('mode', [
        z.object({
            mode: z.literal('random').meta({
                title: 'Random',
                description:
                    'Selects goals completely at random. This is the only selection mode compatible with a random board layout. This selection mode is not compatible with any layout that requires goal difficulties.',
            }),
        }),
        z.object({
            mode: z.literal('difficulty').meta({
                title: 'Difficulty',
                description:
                    'Selects goals based on their difficulty, placing them only in cells with a matching value from layout generation. Incompatible with random board layouts.',
            }),
        }),
    ]);

    const GenerationGoalRestrictionSchema = z.discriminatedUnion('type', [
        z.object({
            type: z.literal('line-type-exclusion').meta({
                title: 'Line Type Exclusion',
                description:
                    'Utilizes goal categories to minimize the synergy in each line by minimizing hte total overlap of categories in the line. With this restriction, a goal with the minimum possible overlap will be placed in each cell.',
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
        schema: z
            .object({
                goalFilters: z
                    .array(GoalFilterSchema)
                    .default([])
                    .refine(
                        (arr) => {
                            return (
                                new Set(arr.map((filter) => filter.mode))
                                    .size === arr.length
                            );
                        },
                        { error: 'Duplicate filter types not allowed' },
                    )
                    .meta({
                        title: 'Goal Filters',
                        description:
                            'Goal filters allow the generator remove goals the meet specific criteria from the generation pool before generation starts. By default, the generator will pull from all goals available to the game',
                    }),
                goalTransformation: z
                    .array(GoalTransformationSchema)
                    .default([])
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
                        'Determines how goals are laid out on the bingo board, and how goals can be chosen in the next step of generation.',
                }),
                goalSelection: GenerationGoalSelectionSchema.default({
                    mode: 'random',
                }).meta({
                    title: 'Goal Selection',
                    description:
                        'Determines how goals are selected from the pool of possible goals to be placed on the board. Selection mode determines how board layout is interpreted by the generator.',
                }),
                restrictions: z
                    .array(GenerationGoalRestrictionSchema)
                    .default([])
                    .meta({
                        title: 'Cell Restrictions',
                        description:
                            'Applies additional restrictions on cells, which prevents the placement of otherwise valid goals in the cell.',
                    }),
                adjustments: z
                    .array(GenerationGlobalAdjustmentsSchema)
                    .default([])
                    .meta({
                        title: 'Global Adjustments',
                        description:
                            'Applies modifications after a goal is selected and placed in the board, which may affect the placement of future goals.',
                    }),
            })
            .refine(
                ({ boardLayout, goalSelection }) => {
                    if (boardLayout.mode === 'random') {
                        return goalSelection.mode === 'random';
                    } else {
                        return goalSelection.mode !== 'random';
                    }
                },
                {
                    error: 'Invalid combination of board layout and goal selection',
                },
            ),
        metadata: z.globalRegistry,
    };
};

export type GeneratorSettings = z.infer<
    ReturnType<typeof makeGeneratorSchema>['schema']
>;
