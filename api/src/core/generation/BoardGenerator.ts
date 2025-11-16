import { GeneratorSettings } from '@playbingo/shared';
import { Category } from '@prisma/client';
import {
    BoardLayoutGenerator,
    createLayoutGenerator,
} from './BoardLayoutGenerator';
import { GenerationFailedError } from './GenerationFailedError';
import { GeneratorGoal } from './GeneratorCore';
import { createGlobalAdjustment, GlobalAdjustment } from './GlobalAdjustments';
import { createPruner, GoalListPruner } from './GoalListPruner';
import { createTransformer, GoalListTransformer } from './GoalListTransformer';
import {
    createPlacementRestriction,
    GoalPlacementRestriction,
} from './GoalPlacementRestriction';

export type LayoutCell = Extract<
    GeneratorSettings['boardLayout'],
    { mode: 'custom' }
>['layout'][number][number];
/**
 *
 */
export class BoardGenerator {
    // generation strategies
    goalFilters: GoalListPruner[];
    goalTransformers: GoalListTransformer[];
    layoutGenerator: BoardLayoutGenerator;
    placementRestrictions: GoalPlacementRestriction[];
    globalAdjustments: GlobalAdjustment[];

    // core generation elements
    seed: number;
    allGoals: GeneratorGoal[] = [];
    categories: Category[];
    goals: GeneratorGoal[] = [];
    layout: LayoutCell[][] = [];
    board: GeneratorGoal[][] = [];

    // global state
    categoryMaxes: { [k: string]: number } = {};

    customBoardLayout?: LayoutCell[][];

    goalsByDifficulty: { [d: number]: GeneratorGoal[] } = {};
    goalsByCategory: { [c: string]: GeneratorGoal[] } = {};
    goalCopies: { [k: string]: number } = {};
    categoriesByName: { [k: string]: Category } = {};
    categoriesById: { [k: string]: Category } = {};

    constructor(
        goals: GeneratorGoal[],
        categories: Category[],
        config: GeneratorSettings,
        seed?: number,
    ) {
        this.allGoals = goals;
        this.goals = [...this.allGoals];
        this.categories = categories;
        this.goalFilters = config.goalFilters.map((s) => createPruner(s));
        this.goalTransformers = config.goalTransformation.map((t) =>
            createTransformer(t),
        );
        this.layoutGenerator = createLayoutGenerator(config.boardLayout);
        this.placementRestrictions = config.restrictions.map((s) =>
            createPlacementRestriction(s),
        );
        this.globalAdjustments = config.adjustments.map((s) =>
            createGlobalAdjustment(s),
        );

        this.seed = seed ?? Math.ceil(999999 * Math.random());
        categories.forEach((cat) => {
            this.categoryMaxes[cat.name] = cat.max <= 0 ? -1 : cat.max;
            this.categoriesByName[cat.name] = cat;
            this.categoriesById[cat.id] = cat;
        });

        this.goals.forEach((goal) => {
            if (goal.difficulty) {
                const prev = this.goalsByDifficulty[goal.difficulty] ?? [];
                this.goalsByDifficulty[goal.difficulty] = [...prev, goal];
            }
            goal.categories.forEach((cat) => {
                const prev =
                    this.goalsByCategory[this.categoriesByName[cat].id] ?? [];
                this.goalsByCategory[this.categoriesByName[cat].id] = [
                    ...prev,
                    goal,
                ];
            });
            this.goalCopies[goal.id] = 1;
        });

        this.customBoardLayout =
            config.boardLayout.mode === 'custom'
                ? config.boardLayout.layout
                : undefined;
    }

    async reset(seed?: number) {
        this.seed = seed ?? Math.ceil(999999 * Math.random());
        this.goals = [...this.allGoals];
        this.layout = [];
        this.board = [];
        this.categoryMaxes = {};
        this.goalsByDifficulty = {};
        this.goalsByCategory = {};
        this.goalCopies = {};

        this.goals.forEach((goal) => {
            if (goal.difficulty) {
                const prev = this.goalsByDifficulty[goal.difficulty] ?? [];
                this.goalsByDifficulty[goal.difficulty] = [...prev, goal];
            }
            goal.categories.forEach((cat) => {
                const prev =
                    this.goalsByCategory[this.categoriesByName[cat].id] ?? [];
                this.goalsByCategory[this.categoriesByName[cat].id] = [
                    ...prev,
                    goal,
                ];
            });
            this.goalCopies[goal.id] = 1;
        });
    }

    generateBoard() {
        // get the goal list to be used in generation
        this.pruneGoalList();
        this.transformGoals();

        // board generation
        this.generateBoardLayout();
        if (this.goals.length < this.layout.length * this.layout[0].length) {
            throw new GenerationFailedError(
                'Not enough goals to generate. Are too many goals filtered?',
                this,
            );
        }

        // preprocessing

        // goal placement
        this.layout.forEach((row, rowIndex) => {
            this.board[rowIndex] = [];
            row.forEach((_, colIndex) => {
                const goals = this.validGoalsForCell(rowIndex, colIndex);
                const goal = goals.pop();
                if (!goal) {
                    throw new GenerationFailedError(
                        'No valid goals left to be placed in the current cell',
                        this,
                        rowIndex,
                        colIndex,
                        this.layout[rowIndex][colIndex],
                    );
                }
                this.board[rowIndex][colIndex] = goal;
                this.adjustGoalList(goal);
            });
        });
    }

    pruneGoalList() {
        this.goalFilters.forEach((f) => f(this));
    }

    transformGoals() {
        this.goalTransformers.forEach((t) => t(this));
    }

    generateBoardLayout() {
        this.layoutGenerator(this);
    }

    validGoalsForCell(row: number, col: number) {
        let goals: GeneratorGoal[];
        switch (this.layout[row][col].selectionCriteria) {
            case 'difficulty':
                goals =
                    this.goalsByDifficulty[this.layout[row][col].difficulty];
                break;
            case 'category':
                goals = this.goalsByCategory[this.layout[row][col].category];
                break;
            case 'random':
                goals = this.goals;
                break;
        }
        let finalList: GeneratorGoal[] = [];
        goals.forEach((goal) => {
            finalList.push(...Array(this.goalCopies[goal.id]).fill(goal));
        });
        this.placementRestrictions.forEach(
            (f) => (finalList = f(this, row, col, finalList)),
        );
        return finalList;
    }

    adjustGoalList(lastPlaced: GeneratorGoal) {
        this.goalCopies[lastPlaced.id] = 0;
        this.globalAdjustments.forEach((f) => f(this, lastPlaced));
    }
}
