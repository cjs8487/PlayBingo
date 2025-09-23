import { GeneratorConfig } from '@playbingo/shared';
import BoardGenerator from './BoardGenerator';
import { GeneratorGoal } from './GeneratorCore';

const LINE_CHECK_LIST: number[][] = [];
LINE_CHECK_LIST[0] = [1, 2, 3, 4, 5, 10, 15, 20, 6, 12, 18, 24];
LINE_CHECK_LIST[1] = [0, 2, 3, 4, 6, 11, 16, 21];
LINE_CHECK_LIST[2] = [0, 1, 3, 4, 7, 12, 17, 22];
LINE_CHECK_LIST[3] = [0, 1, 2, 4, 8, 13, 18, 23];
LINE_CHECK_LIST[4] = [0, 1, 2, 3, 8, 12, 16, 20, 9, 14, 19, 24];
LINE_CHECK_LIST[5] = [0, 10, 15, 20, 6, 7, 8, 9];
LINE_CHECK_LIST[6] = [0, 12, 18, 24, 5, 7, 8, 9, 1, 11, 16, 21];
LINE_CHECK_LIST[7] = [5, 6, 8, 9, 2, 12, 17, 22];
LINE_CHECK_LIST[8] = [4, 12, 16, 20, 9, 7, 6, 5, 3, 13, 18, 23];
LINE_CHECK_LIST[9] = [4, 14, 19, 24, 8, 7, 6, 5];
LINE_CHECK_LIST[10] = [0, 5, 15, 20, 11, 12, 13, 14];
LINE_CHECK_LIST[11] = [1, 6, 16, 21, 10, 12, 13, 14];
LINE_CHECK_LIST[12] = [
    0, 6, 12, 18, 24, 20, 16, 8, 4, 2, 7, 17, 22, 10, 11, 13, 14,
];
LINE_CHECK_LIST[13] = [3, 8, 18, 23, 10, 11, 12, 14];
LINE_CHECK_LIST[14] = [4, 9, 19, 24, 10, 11, 12, 13];
LINE_CHECK_LIST[15] = [0, 5, 10, 20, 16, 17, 18, 19];
LINE_CHECK_LIST[16] = [15, 17, 18, 19, 1, 6, 11, 21, 20, 12, 8, 4];
LINE_CHECK_LIST[17] = [15, 16, 18, 19, 2, 7, 12, 22];
LINE_CHECK_LIST[18] = [15, 16, 17, 19, 23, 13, 8, 3, 24, 12, 6, 0];
LINE_CHECK_LIST[19] = [4, 9, 14, 24, 15, 16, 17, 18];
LINE_CHECK_LIST[20] = [0, 5, 10, 15, 16, 12, 8, 4, 21, 22, 23, 24];
LINE_CHECK_LIST[21] = [20, 22, 23, 24, 1, 6, 11, 16];
LINE_CHECK_LIST[22] = [2, 7, 12, 17, 20, 21, 23, 24];
LINE_CHECK_LIST[23] = [20, 21, 22, 24, 3, 8, 13, 18];
LINE_CHECK_LIST[24] = [0, 6, 12, 18, 20, 21, 22, 23, 19, 14, 9, 4];

type PlacementRestriction = GeneratorConfig['restrictions'][number];

export type GoalPlacementRestriction = (
    generator: BoardGenerator,
    cell: number,
    goals: GeneratorGoal[],
) => GeneratorGoal[];

export const createPlacementRestriction = (
    restriction: PlacementRestriction,
) => {
    switch (restriction.type) {
        case 'line-type-exclusion':
            return preferDistinctTypesInLine;
        default:
            throw Error(`Unknown placement restriction ${restriction.type}`);
    }
};

const preferDistinctTypesInLine: GoalPlacementRestriction = (
    generator,
    cell,
    goals,
) => {
    // minimizes the type overlap with already placed goals
    let minSyn = Number.MAX_VALUE;
    let synGoals: GeneratorGoal[] = [];
    goals.forEach((g) => {
        let synergy = 0;
        for (let j = 0; j < LINE_CHECK_LIST[cell].length; j++) {
            const typesB =
                generator.board[LINE_CHECK_LIST[cell][j]]?.categories;
            if (
                typeof g.categories != 'undefined' &&
                typeof typesB != 'undefined'
            ) {
                for (let k = 0; k < g.categories.length; k++) {
                    for (let l = 0; l < typesB.length; l++) {
                        if (g.categories[k] == typesB[l]) {
                            synergy++;
                            if (k == 0) {
                                synergy++;
                            }
                            if (l == 0) {
                                synergy++;
                            }
                        }
                    }
                }
            }
        }
        if (synergy === minSyn) {
            synGoals.push(g);
        } else if (synergy < minSyn) {
            synGoals = [g];
            minSyn = synergy;
        }
    });
    return synGoals;
};
