import { z } from 'zod';
import { Cell } from './Cell';

const RevealedBoard = z.object({
    hidden: z.literal(false),
    board: z.array(z.array(Cell)),
    width: z.number(),
    height: z.number(),
});

const HiddenBoard = z.object({
    hidden: z.literal(true),
    width: z.number(),
    height: z.number(),
});

export const Board = z.discriminatedUnion('hidden', [
    RevealedBoard,
    HiddenBoard,
]);

export type Board = z.infer<typeof Board>;
