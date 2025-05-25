export interface GeneratorGoal {
    id: string;
    goal: string;
    description: string | null;
    categories: string[];
    difficulty: number | null;
}

export interface GlobalGenerationState {
    useCategoryMaxes: boolean;
    categoryMaxes: { [k: string]: number };
}
