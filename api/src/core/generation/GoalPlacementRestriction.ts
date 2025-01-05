import { GenerationGoalRestriction, Goal } from '@prisma/client';
import BoardGenerator from './BoardGenerator';

export type GoalPlacementRestriction = (generator: BoardGenerator) => void;

export const createPlacementRestriction = (
    strategy: GenerationGoalRestriction,
) => {
    switch (strategy) {
        case 'LINE_TYPE_EXCLUSION':
            return preferDistinctTypesInLine;
        default:
            throw Error('Unknwon GenerationGoalRestriction');
    }
};

const preferDistinctTypesInLine: GoalPlacementRestriction = (generator) => {
    throw Error('Not implemented');
};
