import { GeneratorConfig } from '@playbingo/shared';
import BoardGenerator from './BoardGenerator';
import { GeneratorGoal } from './GeneratorCore';

type GoalSelectionMode = GeneratorConfig['goalSelection'];

export type GoalGrouper = (generator: BoardGenerator) => void;

export const createGoalGrouper = (selectionMode: GoalSelectionMode) => {
    switch (selectionMode) {
        case 'difficulty':
            return difficulty;
        case 'random':
            return random;
        default:
            throw Error('Unknown GenerationGoalSelection');
    }
};

const difficulty: GoalGrouper = (generator) => {
    generator.groupedGoals = generator.goals.reduce<GeneratorGoal[][]>(
        (curr, goal) => {
            const diff = goal.difficulty ?? 0;
            if (curr[diff]) {
                curr[diff].push(goal);
            } else {
                curr[diff] = [goal];
            }
            return curr;
        },
        [],
    );
};

const random: GoalGrouper = (generator) => {
    generator.groupedGoals = [[...generator.goals]];
};
