import { GenerationListTransform } from '@prisma/client';
import BoardGenerator from './BoardGenerator';

export type GoalListTransformer = (generator: BoardGenerator) => void;

export const createTransformer = (strategy: GenerationListTransform) => {
    switch (strategy) {
        case 'NONE':
            return noTransform;
        default:
            throw Error('Unknown GenerationListTransformStrategy');
    }
};

const noTransform: GoalListTransformer = () => {};
