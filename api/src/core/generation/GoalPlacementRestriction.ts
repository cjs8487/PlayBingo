import { GenerationGoalRestriction } from '@prisma/client';
import BoardGenerator from './BoardGenerator';

export type GoalPlacementRestriction = (generator: BoardGenerator) => void;

export const createRestriction = (strategy: GenerationGoalRestriction) => {
    switch (strategy) {
        case 'LINE_TYPE_EXCLUSION':
            throw Error('Not implemented');
        default:
            throw Error('Unknwon GenerationGoalRestriction');
    }
};
