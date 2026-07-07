import { z } from 'zod';
import { User } from './User';
import { Variant } from './Variant';

export const DifficultyVariant = z.object({
    id: z.string(),
    name: z.string(),
    goalAmounts: z.array(z.number()),
});

export const GameResource = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    description: z.string().optional(),
});

export const Game = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    owners: z.array(User),
    moderators: z.array(User),
    favorited: z.boolean(),
    isMod: z.boolean(),
    enableSRLv5: z.boolean(),
    racetimeBeta: z.boolean(),
    racetimeCategory: z.string().optional(),
    racetimeGoal: z.string().optional(),
    difficultyVariantsEnabled: z.boolean(),
    difficultyVariants: z.array(DifficultyVariant).optional(),
    difficultyGroups: z.number().optional(),
    slugWords: z.array(z.string()).optional(),
    useTypedRandom: z.boolean(),
    generationSettings: z.object(),
    newGeneratorBeta: z.boolean(),
    descriptionMd: z.string().optional(),
    setupMd: z.string().optional(),
    variants: z.array(Variant).optional(),
    resources: z.array(GameResource).optional(),
});

export type Game = z.infer<typeof Game>;
