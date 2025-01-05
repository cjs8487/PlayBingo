import {
    GenerationBoardLayout,
    GenerationGlobalAdjustments,
    GenerationGoalRestriction,
    GenerationGoalSelection,
    GenerationListMode,
    GenerationListTransform,
    Goal,
} from '@prisma/client';
import BoardGenerator from '../../core/generation/BoardGenerator';
import { prismaMock } from '../prisma';

const categories = [
    'Category 1',
    'Category 2',
    'Category 3',
    'Category 4',
    'Category 5',
];

const goals: Goal[] = Array.from({ length: 25 }).map((_, i) => ({
    id: `${i}`,
    goal: `Goal ${i + 1}`,
    description: `Description for Goal ${i + 1}`,
    categories: [categories[i % categories.length]],
    difficulty: (i % 25) + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    gameId: '1',
}));

describe('BoardGenerator initialization', () => {
    it('Throws for no layout and difficulty selection', () => {
        expect(() => {
            new BoardGenerator(
                goals,
                GenerationListMode.NONE,
                GenerationListTransform.NONE,
                GenerationBoardLayout.NONE,
                GenerationGoalSelection.DIFFICULTY,
                [],
                [],
            );
        }).toThrow('Invalid configuration');
    });
});

describe('List Pruning', () => {});

describe('Goal Transformation', () => {});

describe('Board Layout', () => {
    describe('Magic Square', () => {
        const generator = new BoardGenerator(
            goals,
            GenerationListMode.NONE,
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [],
        );

        it('throws not implemented', () => {
            expect(() => {
                generator.generateBoardLayout();
            }).toThrow('Not implemented');
        });
    });

    describe('Static Placement (Isaac)', () => {
        const generator = new BoardGenerator(
            goals,
            GenerationListMode.NONE,
            GenerationListTransform.NONE,
            GenerationBoardLayout.ISAAC,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [],
        );

        it('throws not implemented', () => {
            expect(() => {
                generator.generateBoardLayout();
            }).toThrow('Not implemented');
        });
    });
});

describe('Goal Grouping', () => {
    describe('Random Placement', () => {
        const generator = new BoardGenerator(
            goals,
            GenerationListMode.NONE,
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.RANDOM,
            [],
            [],
        );

        it('throws not implemented', () => {
            expect(() => {
                generator.groupGoals();
            }).toThrow('Not implemented');
        });
    });

    describe('Difficulty Placement', () => {
        const generator = new BoardGenerator(
            goals,
            GenerationListMode.NONE,
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [],
        );

        it('throws not implemented', () => {
            expect(() => {
                generator.groupGoals();
            }).toThrow('Not implemented');
        });
    });
});

describe('Goal Restriction', () => {
    describe('Line Type Exclusion', () => {
        const generator = new BoardGenerator(
            goals,
            GenerationListMode.NONE,
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [GenerationGoalRestriction.LINE_TYPE_EXCLUSION],
            [],
        );

        it('throws not implemented', () => {
            expect(() => {
                generator.validGoalsForCell(0);
            }).toThrow('Not implemented');
        });
    });
});

describe('Global Adjustments', () => {
    describe('Synergize', () => {
        const generator = new BoardGenerator(
            goals,
            GenerationListMode.NONE,
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [GenerationGlobalAdjustments.SYNERGIZE],
        );

        it('throws not implemented', () => {
            expect(() => {
                generator.adjustGoalList();
            }).toThrow('Not implemented');
        });
    });

    describe('Max Goals of Type in Board', () => {
        const generator = new BoardGenerator(
            goals,
            GenerationListMode.NONE,
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [GenerationGlobalAdjustments.BOARD_TYPE_MAX],
        );

        it('throws not implemented', () => {
            expect(() => {
                generator.adjustGoalList();
            }).toThrow('Not implemented');
        });
    });
});
