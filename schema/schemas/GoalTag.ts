import { z } from 'zod';

export const GoalTag = z.object({
    id: z.string(),
    name: z.string(),
    goalCount: z.number().optional(),
});

export type GoalTag = z.infer<typeof GoalTag>;
