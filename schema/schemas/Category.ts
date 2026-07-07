import { z } from 'zod';

export const Category = z.object({
    id: z.string(),
    name: z.string(),
    gameId: z.string(),
    max: z.number(),
});

export type Category = z.infer<typeof Category>;
