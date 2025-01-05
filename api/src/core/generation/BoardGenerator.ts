import {
    Goal,
    Game,
    GenerationBoardLayout,
    GenerationGoalSelection,
} from '@prisma/client';
import { gameForSlug } from '../../database/games/Games';
import { goalsForGame } from '../../database/games/Goals';
import { difficulty } from './SRLv5';

const NOT_INITIALIZED = 'Generator not properly initialized';

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

//TODO: implement strategy pattern to improve readability of this class

/**
 *
 */
export default class BoardGenerator {
    slug: string;
    initialized: boolean = false;
    game?: Game;
    allGoals: Goal[] = [];
    goals: Goal[] = [];
    groupedGoals: { [k: number]: Goal[] } = {};
    layout: number[] = [];
    board: Goal[] = [];

    constructor(slug: string) {
        this.slug = slug;
    }

    async init() {
        const game = await gameForSlug(this.slug);
        if (!game) {
            throw Error('Unknown game');
        }

        this.game = game;

        if (!this.validateGeneratorConfig()) {
            throw Error('Invalid game generator configuration');
        }

        this.allGoals = await goalsForGame(this.slug);

        this.initialized = true;
    }

    async reset() {
        if (!this.initialized) {
            await this.init();
        }
        this.goals = [...this.allGoals];
        this.groupedGoals = {};
        this.layout = [];
        this.board = [];
    }

    async generateBoard() {
        if (!this.initialized || !this.game) {
            throw Error(NOT_INITIALIZED);
        }
        // get the goal list to be used in generation
        this.pruneGoalList();
        this.transformGoals();

        // board generation
        this.generateBoardLayout();

        // preprocessing
        const useDiff =
            this.game.generationGoalSelection ===
            GenerationGoalSelection.DIFFICULTY;
        this.groupedGoals = this.goals.reduce<{ [k: number]: Goal[] }>(
            (curr, goal) => {
                const diff = useDiff ? goal.difficulty ?? 0 : 0;
                if (curr[diff]) {
                    curr[diff].push(goal);
                } else {
                    curr[diff] = [goal];
                }
                return curr;
            },
            {},
        );

        // goal placement
        for (let i = 0; i < 25; i++) {
            const goals = this.validGoalsForCell(i);
            const goal = goals.pop();
            if (!goal) {
                throw Error('Unable to place goal');
            }
            this.board[i] = goal;
        }
    }

    validateGeneratorConfig() {
        if (!this.game) {
            throw Error(NOT_INITIALIZED);
        }
        if (this.game.generationBoardLayout === GenerationBoardLayout.NONE) {
            if (
                this.game.generationGoalSelection !==
                GenerationGoalSelection.RANDOM
            ) {
                // random generation is the only mode that works with no board
                // layout precalcualtion
                return false;
            }
        }
        return true;
    }

    pruneGoalList() {
        if (!this.initialized || !this.game || !this.goals) {
            throw Error(NOT_INITIALIZED);
        }
        switch (this.game.generationListMode) {
            case 'NONE':
                break;
            default:
                throw Error('Unknown GenerationListMode');
        }
    }

    transformGoals() {
        if (!this.initialized || !this.game || !this.goals) {
            throw Error(NOT_INITIALIZED);
        }
        switch (this.game.generationListTransform) {
            case 'NONE':
                break;
            default:
                throw Error('Unknown GenerationListMode');
        }
    }

    generateBoardLayout() {
        if (!this.initialized || !this.game) {
            throw Error(NOT_INITIALIZED);
        }
        switch (this.game.generationBoardLayout) {
            case 'NONE':
                this.layout = new Array(25).fill(0);
                break;
            case 'SRLv5':
                for (let i = 0; i < 25; i++) {
                    this.layout[i] = difficulty(i + 1, 0);
                }
                break;
            default:
                throw Error('Unknown GenerationListMode');
        }
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
        if (!this.initialized || !this.game || !this.goals) {
            throw Error(NOT_INITIALIZED);
        }
        let goals: Goal[] = [...this.groupedGoals[this.layout[cell]]];
        this.game.generationGoalRestrictions.forEach((adj) => {
            switch (adj) {
                case 'LINE_TYPE_EXCLUSION':
                    // minimizes the type overlap with already placed goals
                    let minSyn = Number.MAX_VALUE;
                    let synGoals: Goal[] = [];
                    goals.forEach((g) => {
                        const synergy = this.checkLine(cell, g.categories);
                        if (synergy === minSyn) {
                            goals.push(g);
                        } else if (synergy < minSyn) {
                            synGoals = [g];
                            minSyn = synergy;
                        }
                    });
                    goals = synGoals;
                    break;
                default:
                    throw Error('Unknown GenerationGoalRestriction');
            }
        });
        return goals;
    }

    adjustGoalList(chosenGoal: Goal) {
        if (!this.initialized || !this.game || !this.goals) {
            throw Error(NOT_INITIALIZED);
        }
        this.game.generationGlobalAdjustments.forEach((adj) => {
            switch (adj) {
                case 'NONE':
                    break;
                case 'SYNERGIZE':
                    // TODO: duplicate goals in the goal
                    break;
                case 'BOARD_TYPE_MAX':
                    // TODO: update global data and remove goals if needed
                    break;
                default:
                    throw Error('Unknown GenerationGlobalAdjustment');
            }
        });
    }
}
