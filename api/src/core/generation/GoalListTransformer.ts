import { GeneratorSettings } from '@playbingo/shared';
import { BoardGenerator } from './BoardGenerator';

type GoalTransformer = GeneratorSettings['goalTransformation'][number];

export type GoalListTransformer = (generator: BoardGenerator) => void;

export const createTransformer = (strategy: GoalTransformer) => {
    switch (strategy.mode) {
        case 'none':
            return noTransform;
        default:
            throw Error('Unknown GenerationListTransformStrategy');
    }
};

const noTransform: GoalListTransformer = () => {};
