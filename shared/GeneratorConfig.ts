import * as z from 'zod';
import { GoalCategory } from '@playbingo/types';

export const makeGeneratorSchema = (categories: GoalCategory[]) => {
    const enumLabels: Record<string, string> = {};

    const catIds = categories.map((c) => {
        enumLabels[c.id] = c.name;
        return c.id;
    });

    const GenerationListModeSchema = z.discriminatedUnion('mode', [
        z.object({
            mode: z.literal('all'), // default, keep all goals
        }),
        z.object({
            mode: z.literal('difficulty-filter'),
            min: z.number().int().min(1).optional(),
            max: z.number().int().min(1).optional(),
        }),
        z.object({
            mode: z.literal('category-filter'),
            include: z.array(z.enum(catIds)).optional(),
            exclude: z.array(z.enum(catIds)).optional(),
        }),
    ]);

    const GenerationListTransformSchema = z.enum(['none']);

    const GenerationBoardLayoutSchema = z.enum(['none', 'srlv5', 'isaac']);

    const GenerationGoalSelectionSchema = z.enum(['random', 'difficulty']);

    const GenerationGoalRestrictionSchema = z.discriminatedUnion('type', [
        z.object({
            type: z.literal('line-type-exclusion'),
        }),
        z.object({
            type: z.literal('category-cap'),
            category: z.string(),
            max: z.number().int().min(1),
        }),
    ]);

    const GenerationGlobalAdjustmentsSchema = z.discriminatedUnion('type', [
        z.object({
            type: z.literal('synergize'),
        }),
        z.object({
            type: z.literal('board-type-max'),
        }),
    ]);

    return {
        schema: z.object({
            listMode: GenerationListModeSchema.default({ mode: 'all' }),
            listTransform: GenerationListTransformSchema.default('none'),
            boardLayout: GenerationBoardLayoutSchema.default('none'),
            goalSelection: GenerationGoalSelectionSchema.default('random'),
            restrictions: z.array(GenerationGoalRestrictionSchema).default([]),
            adjustments: z.array(GenerationGlobalAdjustmentsSchema).default([]),
        }),
        enumLabels,
    };
};

export type GeneratorConfig = z.infer<
    ReturnType<typeof makeGeneratorSchema>['schema']
>;
