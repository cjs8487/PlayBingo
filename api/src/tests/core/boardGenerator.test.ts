import {
    Category,
    GenerationBoardLayout,
    GenerationGlobalAdjustments,
    GenerationGoalRestriction,
    GenerationGoalSelection,
    GenerationListMode,
    GenerationListTransform,
    Goal,
} from '@prisma/client';
import BoardGenerator from '../../core/generation/BoardGenerator';
import { GeneratorGoal } from '../../core/generation/GeneratorCore';

const categories: Category[] = Array.from({ length: 7 }).map((_, i) => ({
    gameId: '1',
    id: `${i}`,
    max: i % 7,
    name: `Category ${i + 1}`,
}));

const goals: GeneratorGoal[] = Array.from({ length: 100 }).map((_, i) => ({
    goal: `Goal ${i + 1}`,
    description: `Description for Goal ${i + 1}`,
    categories: [
        categories[i % categories.length].name,
        categories[(i + 1) % categories.length].name,
    ],
    difficulty: (i % 25) + 1,
}));

describe('BoardGenerator initialization', () => {
    it('Throws for no layout and difficulty selection', () => {
        expect(() => {
            new BoardGenerator(
                goals,
                categories,
                [],
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
    describe('No Layout', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.NONE,
            GenerationGoalSelection.RANDOM,
            [],
            [],
        );

        it('Generates a zero-filled array', () => {
            generator.generateBoardLayout();
            const layout = generator.layout;
            expect(layout).toHaveLength(25);
            expect(layout).toContain(0);
            expect(layout).not.toContain(1);
            layout.forEach((v) => {
                expect(v).toBe(0);
            });
        });
    });

    describe('Magic Square', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [],
        );

        it('Generates 1-25', () => {
            generator.reset();
            generator.generateBoardLayout();
            const layout = generator.layout;
            expect(layout).toHaveLength(25);
            for (let i = 1; i <= 25; i++) {
                expect(layout).toContain(i);
            }
        });

        it('Generates a valid magic square', () => {
            generator.reset();
            generator.generateBoardLayout();
            const layout = generator.layout;
            const n = 5;
            const magicNum = n * ((n ** 2 + 1) / 2);

            //rows
            for (let i = 0; i < n; i++) {
                const base = n * i;
                expect(
                    layout[base] +
                        layout[base + 1] +
                        layout[base + 2] +
                        layout[base + 3] +
                        layout[base + 4],
                ).toBe(magicNum);
            }

            // columns
            for (let i = 0; i < n; i++) {
                expect(
                    layout[i] +
                        layout[i + n] +
                        layout[i + 2 * n] +
                        layout[i + 3 * n] +
                        layout[i + 4 * n],
                ).toBe(magicNum);
            }

            // diagonals
            expect(
                layout[0] + layout[6] + layout[12] + layout[18] + layout[24],
            ).toBe(magicNum);
            expect(
                layout[4] + layout[8] + layout[12] + layout[16] + layout[20],
            ).toBe(magicNum);
        });

        it('Generates the same square given a seed', () => {
            generator.reset(12345);
            generator.generateBoardLayout();
            const layout = generator.layout;
            const expected = [
                19, 12, 1, 10, 23, 6, 25, 18, 14, 2, 13, 4, 7, 21, 20, 22, 16,
                15, 3, 9, 5, 8, 24, 17, 11,
            ];
            expect(layout).toEqual(expected);
        });
    });

    describe('Static Placement (Isaac)', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.ISAAC,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [],
        );

        const correctLayout = [
            [2, 3, 1, 1, 2],
            [3, 1, 2, 2, 1],
            [1, 2, 4, 2, 1],
            [2, 1, 2, 1, 3],
            [1, 2, 1, 3, 2],
        ].flat();

        it('Generates the correct layout', () => {
            generator.reset();
            generator.generateBoardLayout();
            expect(generator.layout).toEqual(correctLayout);
        });

        it('Is unaffected by seed', () => {
            generator.reset(12345);
            generator.generateBoardLayout();
            expect(generator.layout).toEqual(correctLayout);
        });
    });
});

describe('Goal Grouping', () => {
    describe('Random Placement', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.RANDOM,
            [],
            [],
        );

        it('Puts all goals into group 0', () => {
            generator.reset();
            generator.groupGoals();
            expect(generator.groupedGoals[0]).toEqual(generator.goals);
        });
    });

    describe('Difficulty Placement', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [],
        );

        it('Correctly groups goals with difficulties', () => {
            generator.reset();
            generator.groupGoals();
            for (let i = 1; i <= 25; i++) {
                expect(generator.groupedGoals).toHaveProperty(`${i}`);
            }
        });
    });
});

describe('Goal Restriction', () => {
    describe('Line Type Exclusion', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [GenerationGoalRestriction.LINE_TYPE_EXCLUSION],
            [],
        );

        it('Prefers to place goals of differing types in the same row', () => {
            generator.reset();
            generator.generateBoardLayout();
            generator.groupGoals();
            let goals = generator.validGoalsForCell(0);
            expect(goals).toEqual(generator.groupedGoals[generator.layout[0]]);
            const g = goals.pop();
            if (!g) {
                return fail();
            }
            generator.board[0] = g;
            let restrictedGoals = generator.validGoalsForCell(1);
            // the sample goals only have one category each so we can just
            // expect categories[0] to not equal
            restrictedGoals.forEach((r) => {
                expect(r.categories[0]).not.toEqual(g.categories[0]);
            });

            restrictedGoals = generator.validGoalsForCell(5);
            restrictedGoals.forEach((r) => {
                expect(r.categories[0]).not.toEqual(g.categories[0]);
            });

            restrictedGoals = generator.validGoalsForCell(12);
            restrictedGoals.forEach((r) => {
                expect(r.categories[0]).not.toEqual(g.categories[0]);
            });
        });
    });
});

describe('Global Adjustments', () => {
    describe('Synergize', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [GenerationGlobalAdjustments.SYNERGIZE],
        );

        it('Duplicates goals that share a category', () => {
            generator.reset();
            generator.groupedGoals = [[goals[1]]];
            generator.adjustGoalList(goals[0]);
            expect(generator.groupedGoals[0]).toHaveLength(2);
        });

        it('Duplicates multiple goals in group', () => {
            generator.reset();
            generator.groupedGoals = [
                [goals[1], goals[8]],
                [goals[2]],
                [goals[15], goals[22], goals[29]],
            ];
            generator.adjustGoalList(goals[0]);
            expect(generator.groupedGoals[0]).toHaveLength(4);
            expect(generator.groupedGoals[2]).toHaveLength(6);
        });

        it('Duplicates a goal with multiple shared categories multiple times', () => {
            generator.reset();
            generator.groupedGoals = [[goals[7]], [goals[14], goals[21]]];
            generator.adjustGoalList(goals[0]);
            expect(generator.groupedGoals[0]).toHaveLength(3);
            expect(generator.groupedGoals[1]).toHaveLength(6);
        });

        it('Duplicates a mixed group correctly', () => {
            generator.reset();
            generator.groupedGoals = [
                [goals[1], goals[7]],
                [goals[14], goals[15], goals[21]],
            ];
            generator.adjustGoalList(goals[0]);
            expect(generator.groupedGoals[0]).toHaveLength(5);
            expect(generator.groupedGoals[1]).toHaveLength(8);
        });

        it('Does not duplicate goals that share no categories', () => {
            generator.reset();
            generator.groupedGoals = [
                [goals[2]],
                [goals[1], goals[3]],
                [goals[4], goals[7]],
                [goals[5], goals[14], goals[8], goals[11]],
            ];
            generator.adjustGoalList(goals[0]);
            expect(generator.groupedGoals[0]).toHaveLength(1);
            expect(generator.groupedGoals[1]).toHaveLength(3);
            expect(generator.groupedGoals[2]).toHaveLength(4);
            expect(generator.groupedGoals[3]).toHaveLength(7);
        });
    });

    describe('Max Goals of Type in Board', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [GenerationGlobalAdjustments.BOARD_TYPE_MAX],
        );

        it('Adjusts the maximums in global state', () => {
            generator.reset();
            generator.groupedGoals = [[goals[1]]];
            const cat = categories[1].name;
            generator.categoryMaxes[cat] = 1;
            generator.adjustGoalList(goals[0]);
            expect(generator.categoryMaxes[cat]).toBe(0);
        });

        it('Removes all goals with a category after reaching 0', () => {
            generator.reset();
            generator.groupedGoals = [[goals[1]], [goals[7], goals[8]]];
            const cat = categories[1].name;
            generator.categoryMaxes[cat] = 1;
            generator.adjustGoalList(goals[0]);
            expect(generator.groupedGoals[0]).toHaveLength(0);
            expect(generator.groupedGoals[1]).toHaveLength(0);
        });

        it('Does not remove goals with no matching category', () => {
            generator.reset();
            generator.groupedGoals = [[goals[11], goals[19]]];
            const cat = categories[1].name;
            generator.categoryMaxes[cat] = 1;
            generator.adjustGoalList(goals[0]);
            expect(generator.groupedGoals[0]).toHaveLength(2);
            expect(generator.groupedGoals[0][0]).toStrictEqual(goals[11]);
            expect(generator.groupedGoals[0][1]).toStrictEqual(goals[19]);
        });

        it('Correctly handles a group containing both batching and non-matching categories', () => {
            generator.reset();
            generator.groupedGoals = [[goals[7], goals[11], goals[8]]];
            const cat = categories[1].name;
            generator.categoryMaxes[cat] = 1;
            generator.adjustGoalList(goals[0]);
            expect(generator.groupedGoals[0]).toHaveLength(1);
            expect(generator.groupedGoals[0][0]).toStrictEqual(goals[11]);
        });

        it('Does not change the order of goals in the groups', () => {
            generator.reset();
            generator.groupedGoals = [
                [goals[19], goals[12]],
                [goals[1], goals[13], goals[7], goals[4], goals[20]],
            ];
            const cat = categories[1].name;
            generator.categoryMaxes[cat] = 1;
            generator.adjustGoalList(goals[0]);
            expect(generator.groupedGoals[0]).toHaveLength(2);
            expect(generator.groupedGoals[0][0]).toStrictEqual(goals[19]);
            expect(generator.groupedGoals[0][1]).toStrictEqual(goals[12]);
            expect(generator.groupedGoals[1]).toHaveLength(3);
            expect(generator.groupedGoals[1][0]).toStrictEqual(goals[13]);
            expect(generator.groupedGoals[1][1]).toStrictEqual(goals[4]);
            expect(generator.groupedGoals[1][2]).toStrictEqual(goals[20]);
        });
    });

    it('removes the placed goal from the goal list', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.NONE,
            GenerationGoalSelection.RANDOM,
            [],
            [],
        );
        generator.reset();
        generator.adjustGoalList(goals[0]);
        generator.groupedGoals.forEach((group) => {
            expect(group).not.toContain(goals[0]);
        });
    });
});

describe('Full Generation', () => {
    const generator = new BoardGenerator(
        goals,
        categories,
        [],
        GenerationListTransform.NONE,
        GenerationBoardLayout.NONE,
        GenerationGoalSelection.RANDOM,
        [],
        [],
    );

    it('Successfully generates a fully random board', () => {
        generator.reset();
        expect(() => generator.generateBoard()).not.toThrow();
        expect(generator.board).toHaveLength(25);
    });

    it('Successfully generates an SRLv5 style board', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [GenerationGoalRestriction.LINE_TYPE_EXCLUSION],
            [],
        );
        generator.reset();
        expect(() => generator.generateBoard()).not.toThrow();
        expect(generator.board).toHaveLength(25);
    });

    it('Generates the same board given the same seed (Random)', () => {
        generator.reset(12345);
        generator.generateBoard();
        const board1 = generator.board;
        generator.reset(12345);
        generator.generateBoard();
        const board2 = generator.board;
        expect(board1).toEqual(board2);
    });

    it('Generates the same board given the same seed (SRLv5)', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [GenerationGoalRestriction.LINE_TYPE_EXCLUSION],
            [],
        );
        generator.reset(12345);
        generator.generateBoard();
        const board1 = generator.board;
        generator.reset(12345);
        generator.generateBoard();
        const board2 = generator.board;
        expect(board1).toEqual(board2);
    });

    it('Generates a board with maximum restrictions', () => {
        const generator = new BoardGenerator(
            goals,
            categories,
            [],
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [GenerationGoalRestriction.LINE_TYPE_EXCLUSION],
            [GenerationGlobalAdjustments.BOARD_TYPE_MAX],
        );
        generator.reset();
        expect(() => generator.generateBoard()).not.toThrow();
    });
});
