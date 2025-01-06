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

const categories = [
    'Category 1',
    'Category 2',
    'Category 3',
    'Category 4',
    'Category 5',
    'Category 6',
    'Category 7',
];

const goals: Goal[] = Array.from({ length: 100 }).map((_, i) => ({
    id: `${i}`,
    goal: `Goal ${i + 1}`,
    description: `Description for Goal ${i + 1}`,
    categories: [
        categories[i % categories.length],
        categories[(i + 1) % categories.length],
    ],
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
    describe('No Layout', () => {
        const generator = new BoardGenerator(
            goals,
            GenerationListMode.NONE,
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
            GenerationListMode.NONE,
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

        it('Puts all goals into group 0', () => {
            generator.reset();
            generator.groupGoals();
            expect(generator.groupedGoals[0]).toEqual(generator.goals);
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
            GenerationListMode.NONE,
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
            GenerationListMode.NONE,
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
            GenerationListMode.NONE,
            GenerationListTransform.NONE,
            GenerationBoardLayout.SRLv5,
            GenerationGoalSelection.DIFFICULTY,
            [],
            [GenerationGlobalAdjustments.BOARD_TYPE_MAX],
        );

        it('throws not implemented', () => {
            expect(() => {
                generator.adjustGoalList(goals[0]);
            }).toThrow('Not implemented');
        });
    });
});
