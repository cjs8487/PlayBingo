import { Category } from '@prisma/client';

export interface GeneratorGoal {
    id: string;
    goal: string;
    description: string | null;
    categories: Category[];
    difficulty: number | null;
}

export interface GlobalGenerationState {
    useCategoryMaxes: boolean;
    categoryMaxes: { [k: string]: number };
}
