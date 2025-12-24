import { Prisma } from '@prisma/client';

export type GeneratorGoal = Omit<
    Prisma.GoalGetPayload<{ include: { categories: true; tags: true } }>,
    'createdAt' | 'updatedAt' | 'oldCategories' | 'gameId'
>;

export interface GlobalGenerationState {
    useCategoryMaxes: boolean;
    categoryMaxes: { [k: string]: number };
}
