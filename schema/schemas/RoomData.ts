import { z } from 'zod';

export const RoomData = z.object({
    name: z.string(),
    game: z.string(),
    slug: z.string(),
    gameSlug: z.string(),
    racetimeConnection: z
        .object({
            gameActive: z.boolean().optional(),
            url: z.string().optional(),
            websocketConnected: z.boolean().optional(),
            status: z.string().optional(),
            startDelay: z.string().optional(),
        })
        .optional(),
    newGenerator: z.boolean(),
    token: z.string().optional(),
    variant: z.string(),
    mode: z.string(),
    seed: z.number(),
    startedAt: z.string().optional(),
    finishedAt: z.string().optional(),
    raceHandler: z.string().optional(),
});

export type RoomData = z.infer<typeof RoomData>;
