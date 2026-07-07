import { z } from 'zod';
import { Category } from './Category';
import { GoalTag } from './GoalTag';

export const Goal = z.object({
    id: z.string(),
    goal: z.string(),
    description: z.string().optional(),
    difficulty: z.number().optional(),
    categories: z.array(Category).optional(),
    tags: z.array(GoalTag).optional(),
    meta: z.object({}).optional(),
});

export type Goal = z.infer<typeof Goal>;
