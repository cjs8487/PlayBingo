import { z } from 'zod';

export const GoalCategory = z.object({
    id: z.string(),
    name: z.string(),
    max: z.number().optional(),
    goalCount: z.number(),
});

export type GoalCategory = z.infer<typeof GoalCategory>;
