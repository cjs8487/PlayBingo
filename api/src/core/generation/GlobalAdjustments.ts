import { GeneratorSettings } from '@playbingo/shared';
import BoardGenerator from './BoardGenerator';
import { GeneratorGoal } from './GeneratorCore';

type Adjustment = GeneratorSettings['adjustments'][number];

export type GlobalAdjustment = (
    generator: BoardGenerator,
    lastPlaced: GeneratorGoal,
) => void;

export const createGlobalAdjustment = (adjustment: Adjustment) => {
    switch (adjustment.type) {
        case 'synergize':
            return synergize;
        case 'board-type-max':
            return boardTypeMax;
        default:
            throw Error(`Unknown global adjustment`);
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

const boardTypeMax: GlobalAdjustment = (generator, lastPlaced) => {
    lastPlaced.categories.forEach((cat) => {
        generator.categoryMaxes[cat]--;
        if (generator.categoryMaxes[cat] === 0) {
            generator.groupedGoals.forEach((group, index) => {
                generator.groupedGoals[index] = group.filter(
                    (g) => !g.categories.includes(cat),
                );
            });
        }
    });
};
