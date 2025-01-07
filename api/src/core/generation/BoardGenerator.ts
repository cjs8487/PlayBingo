import {
    Goal,
    Game,
    GenerationBoardLayout,
    GenerationGoalSelection,
    GenerationListMode,
    GenerationListTransform,
    GenerationGlobalAdjustments,
    GenerationGoalRestriction,
    Category,
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
import { GeneratorGoal } from './GeneratorCore';
import { shuffle } from '../../util/Array';

/**
 *
 */
export default class BoardGenerator {
    // generation strategies
    goalListPruner: GoalListPruner;
    goalListTransformer: GoalListTransformer;
    layoutGenerator: BoardLayoutGenerator;
    goalGrouper: GoalGrouper;
    placementRestrictions: GoalPlacementRestriction[];
    globalAdjustments: GlobalAdjustment[];

    // core generation elements
    seed: number;
    allGoals: GeneratorGoal[] = [];
    categories: Category[];
    goals: GeneratorGoal[] = [];
    groupedGoals: GeneratorGoal[][] = [];
    layout: number[] = [];
    board: GeneratorGoal[] = [];

    // global state
    categoryMaxes: { [k: string]: number } = {};

    constructor(
        goals: GeneratorGoal[],
        categories: Category[],
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
        this.categories = categories;
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
        categories.forEach((cat) => {
            this.categoryMaxes[cat.name] = cat.max <= 0 ? -1 : cat.max;
        });
    }

    async reset(seed?: number) {
        this.seed = seed ?? Math.ceil(999999 * Math.random());
        this.goals = [...this.allGoals];
        this.groupedGoals = [];
        this.layout = [];
        this.board = [];
        this.categoryMaxes = {};
    }

    generateBoard() {
        // get the goal list to be used in generation
        this.pruneGoalList();
        this.transformGoals();

        // board generation
        this.generateBoardLayout();

        // preprocessing
        this.groupGoals();
        this.groupedGoals.forEach((group) => {
            shuffle(group, this.seed);
        });

        // goal placement
        for (let i = 0; i < 25; i++) {
            const goals = this.validGoalsForCell(i);
            const goal = goals.pop();
            if (!goal) {
                throw Error('Unable to place goal');
            }
            this.board[i] = goal;
            this.adjustGoalList(goal);
        }
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

    validGoalsForCell(cell: number) {
        let goals = [...this.groupedGoals[this.layout[cell]]];
        this.placementRestrictions.forEach(
            (f) => (goals = f(this, cell, goals)),
        );
        return goals;
    }

    adjustGoalList(lastPlaced: GeneratorGoal) {
        this.groupedGoals.forEach((group, index) => {
            this.groupedGoals[index] = group.filter(
                (g) => g.goal !== lastPlaced.goal,
            );
        });
        this.globalAdjustments.forEach((f) => f(this, lastPlaced));
    }
}
