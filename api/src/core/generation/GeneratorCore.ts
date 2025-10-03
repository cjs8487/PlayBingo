export interface GeneratorGoal {
    id: string;
    goal: string;
    description: string | null;
    translations: {[k: string]: string};
    categories: string[];
    difficulty: number | null;
}

export interface GlobalGenerationState {
    useCategoryMaxes: boolean;
    categoryMaxes: { [k: string]: number };
}
