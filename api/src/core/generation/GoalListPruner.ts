import { GenerationListMode } from '@prisma/client';
import BoardGenerator from './BoardGenerator';

export type GoalListPruner = (generator: BoardGenerator) => void;

export const createPruner = (strategy: GenerationListMode) => {
    switch (strategy) {
        case 'NONE':
            return noPrune;
        default:
            throw Error('Unknown GenerationListMode strategy');
    }
};

const noPrune: GoalListPruner = () => {};
