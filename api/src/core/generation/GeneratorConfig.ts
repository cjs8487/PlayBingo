import { z } from 'zod';

export const GenerationListModeSchema = z.discriminatedUnion('mode', [
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
        include: z.array(z.string()).optional(),
        exclude: z.array(z.string()).optional(),
    }),
]);
export type GenerationListMode = z.infer<typeof GenerationListModeSchema>;

export const GenerationListTransformSchema = z.enum(['none']);
export type GenerationListTransform = z.infer<
    typeof GenerationListTransformSchema
>;

export const GenerationBoardLayoutSchema = z.enum(['none', 'srlv5', 'isaac']);
export type GenerationBoardLayout = z.infer<typeof GenerationBoardLayoutSchema>;

export const GenerationGoalSelectionSchema = z.enum(['random', 'difficulty']);
export type GenerationGoalSelection = z.infer<
    typeof GenerationGoalSelectionSchema
>;

export const GenerationGoalRestrictionSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('line-type-exclusion'),
    }),
    z.object({
        type: z.literal('category-cap'),
        category: z.string(),
        max: z.number().int().min(1),
    }),
]);
export type GenerationGoalRestriction = z.infer<
    typeof GenerationGoalRestrictionSchema
>;

export const GenerationGlobalAdjustmentsSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('synergize'),
    }),
    z.object({
        type: z.literal('board-type-max'),
    }),
]);
export type GenerationGlobalAdjustment = z.infer<
    typeof GenerationGlobalAdjustmentsSchema
>;

export const GeneratorConfigSchema = z.object({
    listMode: GenerationListModeSchema.default({ mode: 'all' }),
    listTransform: GenerationListTransformSchema.default('none'),
    boardLayout: GenerationBoardLayoutSchema.default('none'),
    goalSelection: GenerationGoalSelectionSchema.default('random'),
    restrictions: z.array(GenerationGoalRestrictionSchema).default([]),
    adjustments: z.array(GenerationGlobalAdjustmentsSchema).default([]),
});
export type GeneratorConfig = z.infer<typeof GeneratorConfigSchema>;
