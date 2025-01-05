import { GenerationGoalSelection } from '@prisma/client';
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
    throw Error('Not implemented');
};

const random: GoalGrouper = (generator) => {
    throw Error('Not implemented');
};
