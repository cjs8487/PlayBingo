import { GenerationGlobalAdjustments } from '@prisma/client';
import BoardGenerator from './BoardGenerator';

export type GlobalAdjustment = (generator: BoardGenerator) => void;

export const createGenerator = (strategy: GenerationGlobalAdjustments) => {
    switch (strategy) {
        case 'NONE':
            return noAdjustment;
        case 'SYNERGIZE':
        case 'BOARD_TYPE_MAX':
            throw Error('Not implemented');
        default:
            throw Error('Unknown GenerationListMode strategy');
    }
};

const noAdjustment: GlobalAdjustment = () => {};
