import {
    Goal,
    Game,
    GenerationBoardLayout,
    GenerationGoalSelection,
    GenerationListMode,
    GenerationListTransform,
    GenerationGlobalAdjustments,
    GenerationGoalRestriction,
} from '@prisma/client';
import { gameForSlug } from '../../database/games/Games';
import { goalsForGame } from '../../database/games/Goals';
import { difficulty } from './SRLv5';
import { createPruner, GoalListPruner } from './GoalListPruner';
import { createTransformer, GoalListTransformer } from './GoalListTransformer';
import {
    BoardLayoutGenerator,
    createLayoutGenerator,
} from './BoardLayoutGenerator';
import {
    createPlacementRestriction,
    GoalPlacementRestriction,
} from './GoalPlacementRestriction';
import { createGlobalAdjustment, GlobalAdjustment } from './GlobalAdjustments';
import { createGoalGrouper, GoalGrouper } from './GoalGrouper';

const lineCheckList: number[][] = [];
lineCheckList[0] = [1, 2, 3, 4, 5, 10, 15, 20, 6, 12, 18, 24];
lineCheckList[1] = [0, 2, 3, 4, 6, 11, 16, 21];
lineCheckList[2] = [0, 1, 3, 4, 7, 12, 17, 22];
lineCheckList[3] = [0, 1, 2, 4, 8, 13, 18, 23];
lineCheckList[4] = [0, 1, 2, 3, 8, 12, 16, 20, 9, 14, 19, 24];
lineCheckList[5] = [0, 10, 15, 20, 6, 7, 8, 9];
lineCheckList[6] = [0, 12, 18, 24, 5, 7, 8, 9, 1, 11, 16, 21];
lineCheckList[7] = [5, 6, 8, 9, 2, 12, 17, 22];
lineCheckList[8] = [4, 12, 16, 20, 9, 7, 6, 5, 3, 13, 18, 23];
lineCheckList[9] = [4, 14, 19, 24, 8, 7, 6, 5];
lineCheckList[10] = [0, 5, 15, 20, 11, 12, 13, 14];
lineCheckList[11] = [1, 6, 16, 21, 10, 12, 13, 14];
lineCheckList[12] = [
    0, 6, 12, 18, 24, 20, 16, 8, 4, 2, 7, 17, 22, 10, 11, 13, 14,
];
lineCheckList[13] = [3, 8, 18, 23, 10, 11, 12, 14];
lineCheckList[14] = [4, 9, 19, 24, 10, 11, 12, 13];
lineCheckList[15] = [0, 5, 10, 20, 16, 17, 18, 19];
lineCheckList[16] = [15, 17, 18, 19, 1, 6, 11, 21, 20, 12, 8, 4];
lineCheckList[17] = [15, 16, 18, 19, 2, 7, 12, 22];
lineCheckList[18] = [15, 16, 17, 19, 23, 13, 8, 3, 24, 12, 6, 0];
lineCheckList[19] = [4, 9, 14, 24, 15, 16, 17, 18];
lineCheckList[20] = [0, 5, 10, 15, 16, 12, 8, 4, 21, 22, 23, 24];
lineCheckList[21] = [20, 22, 23, 24, 1, 6, 11, 16];
lineCheckList[22] = [2, 7, 12, 17, 20, 21, 23, 24];
lineCheckList[23] = [20, 21, 22, 24, 3, 8, 13, 18];
lineCheckList[24] = [0, 6, 12, 18, 20, 21, 22, 23, 19, 14, 9, 4];

/**
 *
 */
export default class BoardGenerator {
    goalListPruner: GoalListPruner;
    goalListTransformer: GoalListTransformer;
    layoutGenerator: BoardLayoutGenerator;
    goalGrouper: GoalGrouper;
    placementRestrictions: GoalPlacementRestriction[];
    globalAdjustments: GlobalAdjustment[];

    seed: number;
    allGoals: Goal[] = [];
    goals: Goal[] = [];
    groupedGoals: { [k: number]: Goal[] } = {};
    layout: number[] = [];
    board: Goal[] = [];

    constructor(
        goals: Goal[],
        pruneStrategy: GenerationListMode,
        transformStrategy: GenerationListTransform,
        layoutStrategy: GenerationBoardLayout,
        selectionStrategy: GenerationGoalSelection,
        placementStrategies: GenerationGoalRestriction[],
        adjustmentStrategies: GenerationGlobalAdjustments[],
        seed?: number,
    ) {
        // input validation
        if (layoutStrategy === GenerationBoardLayout.NONE) {
            if (selectionStrategy !== GenerationGoalSelection.RANDOM) {
                // random generation is the only mode that works with no board
                // layout precalcualtion
                throw Error('Invalid configuration');
            }
        }

        this.allGoals = goals;
        this.goalListPruner = createPruner(pruneStrategy);
        this.goalListTransformer = createTransformer(transformStrategy);
        this.layoutGenerator = createLayoutGenerator(layoutStrategy);
        this.goalGrouper = createGoalGrouper(selectionStrategy);
        this.placementRestrictions = placementStrategies.map((s) =>
            createPlacementRestriction(s),
        );
        this.globalAdjustments = adjustmentStrategies.map((s) =>
            createGlobalAdjustment(s),
        );

        this.seed = seed ?? Math.ceil(999999 * Math.random());
    }

    async reset(seed?: number) {
        this.seed = seed ?? Math.ceil(999999 * Math.random());
        this.goals = [...this.allGoals];
        this.groupedGoals = {};
        this.layout = [];
        this.board = [];
    }

    async generateBoard() {
        // get the goal list to be used in generation
        this.pruneGoalList();
        this.transformGoals();

        // board generation
        this.generateBoardLayout();

        // preprocessing
        // const useDiff =
        //     this.game.generationGoalSelection ===
        //     GenerationGoalSelection.DIFFICULTY;
        // this.groupedGoals = this.goals.reduce<{ [k: number]: Goal[] }>(
        //     (curr, goal) => {
        //         const diff = useDiff ? goal.difficulty ?? 0 : 0;
        //         if (curr[diff]) {
        //             curr[diff].push(goal);
        //         } else {
        //             curr[diff] = [goal];
        //         }
        //         return curr;
        //     },
        //     {},
        // );

        // goal placement
        // for (let i = 0; i < 25; i++) {
        //     const goals = this.validGoalsForCell(i);
        //     const goal = goals.pop();
        //     if (!goal) {
        //         throw Error('Unable to place goal');
        //     }
        //     this.board[i] = goal;
        // }
    }

    pruneGoalList() {
        this.goalListPruner(this);
    }

    transformGoals() {
        this.goalListTransformer(this);
    }

    generateBoardLayout() {
        this.layoutGenerator(this);
    }

    groupGoals() {
        this.goalGrouper(this);
    }

    checkLine(i: number, typesA: string[]) {
        let synergy = 0;
        for (let j = 0; j < lineCheckList[i].length; j++) {
            const typesB = this.board[lineCheckList[i][j]]?.categories;
            if (typeof typesA != 'undefined' && typeof typesB != 'undefined') {
                for (let k = 0; k < typesA.length; k++) {
                    for (let l = 0; l < typesB.length; l++) {
                        if (typesA[k] == typesB[l]) {
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
        return synergy;
    }

    validGoalsForCell(cell: number) {
        this.placementRestrictions.forEach((f) => f(this));

        // let goals: Goal[] = [...this.groupedGoals[this.layout[cell]]];
        // // minimizes the type overlap with already placed goals
        // let minSyn = Number.MAX_VALUE;
        // let synGoals: Goal[] = [];
        // goals.forEach((g) => {
        //     const synergy = this.checkLine(cell, g.categories);
        //     if (synergy === minSyn) {
        //         goals.push(g);
        //     } else if (synergy < minSyn) {
        //         synGoals = [g];
        //         minSyn = synergy;
        //     }
        // });
        // goals = synGoals;

        // return goals;
    }

    adjustGoalList() {
        this.globalAdjustments.forEach((f) => f(this));
    }
}
