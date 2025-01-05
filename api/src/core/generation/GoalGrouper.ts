import { GenerationGoalSelection, Goal } from '@prisma/client';
import BoardGenerator from './BoardGenerator';

export type GoalGrouper = (generator: BoardGenerator) => void;

export const createGoalGrouper = (strategy: GenerationGoalSelection) => {
    switch (strategy) {
        case 'DIFFICULTY':
            return difficulty;
        case 'RANDOM':
            return random;
        default:
            throw Error('Unknown GenerationGoalSelection');
    }
};

const difficulty: GoalGrouper = (generator) => {
    generator.groupedGoals = generator.goals.reduce<{ [k: number]: Goal[] }>(
        (curr, goal) => {
            const diff = goal.difficulty ?? 0;
            if (curr[diff]) {
                curr[diff].push(goal);
            } else {
                curr[diff] = [goal];
            }
            return curr;
        },
        {},
    );
};

const random: GoalGrouper = (generator) => {
    throw Error('Not implemented');
};
