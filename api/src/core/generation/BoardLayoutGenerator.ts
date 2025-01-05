import { GenerationBoardLayout } from '@prisma/client';
import BoardGenerator from './BoardGenerator';

export type BoardLayoutGenerator = (generator: BoardGenerator) => void;

export const createLayoutGenerator = (strategy: GenerationBoardLayout) => {
    switch (strategy) {
        case 'NONE':
            return noLayout;
        case 'SRLv5':
            return magicSquare;
        case 'ISAAC':
            return staticDifficulty;
        default:
            throw Error('Unknown GenerationListMode strategy');
    }
};

const noLayout: BoardLayoutGenerator = (generator) => {
    generator.layout = new Array(25).fill(0);
};

const magicSquare: BoardLayoutGenerator = (generator) => {
    throw Error('Not implemented');
};

const staticDifficulty: BoardLayoutGenerator = (generator) => {
    throw Error('Not implemented');
};
