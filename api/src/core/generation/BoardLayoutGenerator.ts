import { GenerationBoardLayout } from '@prisma/client';
import BoardGenerator from './BoardGenerator';

export type BoardLayoutGenerator = (generator: BoardGenerator) => void;

export const createGenerator = (strategy: GenerationBoardLayout) => {
    switch (strategy) {
        case 'NONE':
            return noLayout;
        case 'SRLv5':
        case 'ISAAC':
            throw Error('Not implemented');
        default:
            throw Error('Unknown GenerationListMode strategy');
    }
};

const noLayout: BoardLayoutGenerator = (generator) => {
    generator.layout = new Array(25).fill(0);
};
