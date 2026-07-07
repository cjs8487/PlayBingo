import { z } from 'zod';

export const User = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string().optional(),
    staff: z.boolean(),
    racetimeConnected: z.boolean(),
    avatar: z.string(),
});

export type User = z.infer<typeof User>;
