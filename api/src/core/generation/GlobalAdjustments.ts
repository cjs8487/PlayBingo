import { GenerationGlobalAdjustments, Goal } from '@prisma/client';
import BoardGenerator from './BoardGenerator';
import { GeneratorGoal } from './GeneratorCore';

export type GlobalAdjustment = (
    generator: BoardGenerator,
    lastPlaced: GeneratorGoal,
) => void;

export const createGlobalAdjustment = (
    strategy: GenerationGlobalAdjustments,
) => {
    switch (strategy) {
        case 'SYNERGIZE':
            return synergize;
        case 'BOARD_TYPE_MAX':
            return boardTypeMax;
        default:
            throw Error('Unknown GenerationListMode strategy');
    }
};

const synergize: GlobalAdjustment = (generator, lastPlaced) => {
    for (let i = 0; i < generator.groupedGoals.length; i++) {
        const goals = generator.groupedGoals[i];
        if (!goals) {
            // if there is no goal list return early
            return;
        }
        const adjusted = [...goals];
        lastPlaced.categories.forEach((cat) => {
            goals.forEach((g) => {
                if (g.categories.includes(cat)) {
                    adjusted.push(g);
                }
            });
        });
        generator.groupedGoals[i] = adjusted;
    }
};

const boardTypeMax: GlobalAdjustment = (generator) => {
    throw Error('Not implemented');
};
