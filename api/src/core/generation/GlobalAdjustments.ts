import { GenerationGlobalAdjustments } from '@prisma/client';
import BoardGenerator from './BoardGenerator';

export type GlobalAdjustment = (generator: BoardGenerator) => void;

export const createGlobalAdjustment = (
    strategy: GenerationGlobalAdjustments,
) => {
    switch (strategy) {
        case 'NONE':
            return noAdjustment;
        case 'SYNERGIZE':
            return synergize;
        case 'BOARD_TYPE_MAX':
            return boardTypeMax;
        default:
            throw Error('Unknown GenerationListMode strategy');
    }
};

const noAdjustment: GlobalAdjustment = () => {};

const synergize: GlobalAdjustment = () => {
    throw Error('Not implemented');
};

const boardTypeMax: GlobalAdjustment = (generator) => {
    throw Error('Not implemented');
};
