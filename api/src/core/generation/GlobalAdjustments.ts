import { GeneratorSettings } from '@playbingo/shared';
import { BoardGenerator } from './BoardGenerator';
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
    lastPlaced.categories.forEach((cat) => {
        generator.goalsByCategory[generator.categoriesByName[cat].id].forEach(
            (goal) => {
                // do not add more copies of a goal that has been excluded
                if (generator.goalCopies[goal.id] > 0) {
                    generator.goalCopies[goal.id] += 1;
                }
            },
        );
    });
};

const boardTypeMax: GlobalAdjustment = (generator, lastPlaced) => {
    lastPlaced.categories.forEach((cat) => {
        generator.categoryMaxes[cat]--;
        if (generator.categoryMaxes[cat] === 0) {
            generator.goalsByCategory[
                generator.categoriesByName[cat].id
            ].forEach((goal) => {
                generator.goalCopies[goal.id] = 0;
            });
        }
    });
};
