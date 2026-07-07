import { z } from 'zod';

const RevealedCell = z.object({
    goal: z.string(),
    completedPlayers: z.array(z.string()),
    revealed: z.literal(true),
});

const HiddenCell = z.object({
    revealed: z.literal(false),
    completedPlayers: z.array(z.string()),
});

export const Cell = z.discriminatedUnion('revealed', [
    RevealedCell,
    HiddenCell,
]);

export type Cell = z.infer<typeof Cell>;
