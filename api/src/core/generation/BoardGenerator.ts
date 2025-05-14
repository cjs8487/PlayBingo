import {
    Category,
    GenerationBoardLayout,
    GenerationGlobalAdjustments,
    GenerationGoalRestriction,
    GenerationGoalSelection,
    GenerationListMode,
    GenerationListTransform,
} from '@prisma/client';
import { shuffle } from '../../util/Array';
import {
    BoardLayoutGenerator,
    createLayoutGenerator,
} from './BoardLayoutGenerator';
import { GeneratorGoal } from './GeneratorCore';
import { createGlobalAdjustment, GlobalAdjustment } from './GlobalAdjustments';
import { createGoalGrouper, GoalGrouper } from './GoalGrouper';
import { createPruner, GoalListPruner } from './GoalListPruner';
import { createTransformer, GoalListTransformer } from './GoalListTransformer';
import {
    createPlacementRestriction,
    GoalPlacementRestriction,
} from './GoalPlacementRestriction';
import { GenerationFailedError } from './GenerationFailedError';

/**
 *
 */
export default class BoardGenerator {
    // generation strategies
    goalListPruners: GoalListPruner[];
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
        pruneStrategies: GenerationListMode[],
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

        //@ts-ignore
        if (goals.includes(undefined)) {
            console.log('undefined in goal list');
        }

        this.allGoals = goals;
        this.goals = [...this.allGoals];
        this.categories = categories;
        this.goalListPruners = pruneStrategies.map((s) => createPruner(s));
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
                throw new GenerationFailedError(
                    'No valid goals left to be placed in the current cell',
                    this,
                    i,
                );
            }
            this.board[i] = goal;
            this.adjustGoalList(goal);
        }
    }

    pruneGoalList() {
        this.goalListPruners.forEach((f) => f(this));
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
