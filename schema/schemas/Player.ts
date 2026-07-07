import { z } from 'zod';

export const Player = z.object({
    id: z.string(),
    nickname: z.string(),
    color: z.string(),
    goalCount: z.number(),
    raceStatus: z.string(),
    spectator: z.boolean(),
    monitor: z.boolean(),
    showInRoom: z.boolean(),
});

export type Player = z.infer<typeof Player>;
