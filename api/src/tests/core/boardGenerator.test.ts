import { Category } from '@prisma/client';
import {
    BoardGenerator,
    LayoutCell,
} from '../../core/generation/BoardGenerator';
import { GeneratorGoal } from '../../core/generation/GeneratorCore';

const categories: Category[] = Array.from({ length: 7 }).map((_, i) => ({
    gameId: '1',
    id: `${i}`,
    max: i % 7,
    name: `Category ${i + 1}`,
}));

const goals: GeneratorGoal[] = Array.from({ length: 100 }).map((_, i) => ({
    id: `${i}`,
    goal: `Goal ${i + 1}`,
    description: `Description for Goal ${i + 1}`,
    categories: [
        categories[i % categories.length].name,
        categories[(i + 1) % categories.length].name,
    ],
    difficulty: (i % 25) + 1,
}));

describe('Goal Filters', () => {
    describe('Difficulty', () => {
        it('Filters out all goals with difficulty less than minimum', () => {
            const generator = new BoardGenerator(goals, categories, {
                goalFilters: [{ mode: 'difficulty', min: 5 }],
                goalTransformation: [],
                boardLayout: { mode: 'random' },
                restrictions: [],
                adjustments: [],
            });
            generator.pruneGoalList();
            expect(generator.goals.length).toBeGreaterThan(0);
            generator.goals.forEach((g) => {
                expect(g.difficulty).toBeGreaterThanOrEqual(5);
            });
        });

        it('Filters out all goals with difficulty greater than maximum', () => {
            const generator = new BoardGenerator(goals, categories, {
                goalFilters: [{ mode: 'difficulty', max: 15 }],
                goalTransformation: [],
                boardLayout: { mode: 'random' },
                restrictions: [],
                adjustments: [],
            });
            generator.pruneGoalList();
            expect(generator.goals.length).toBeGreaterThan(0);
            generator.goals.forEach((g) => {
                expect(g.difficulty).toBeLessThanOrEqual(15);
            });
        });

        it('Filters out all goals with difficulty less than minimum and greater than maximum', () => {
            const generator = new BoardGenerator(goals, categories, {
                goalFilters: [{ mode: 'difficulty', min: 3, max: 17 }],
                goalTransformation: [],
                boardLayout: { mode: 'random' },
                restrictions: [],
                adjustments: [],
            });
            generator.pruneGoalList();
            expect(generator.goals.length).toBeGreaterThan(0);
            generator.goals.forEach((g) => {
                expect(g.difficulty).toBeGreaterThanOrEqual(3);
                expect(g.difficulty).toBeLessThanOrEqual(17);
            });
        });
    });

    describe('Categories', () => {
        it('Filters out goals without at least one specified category', () => {
            const generator = new BoardGenerator(goals, categories, {
                goalFilters: [
                    {
                        mode: 'category',
                        categories: ['Category 1', 'Category 4'],
                    },
                ],
                goalTransformation: [],
                boardLayout: { mode: 'random' },
                restrictions: [],
                adjustments: [],
            });
            generator.pruneGoalList();
            expect(generator.goals.length).toBeGreaterThan(0);
            generator.goals.forEach((g) => {
                const hasCat =
                    g.categories.includes('Category 1') ||
                    g.categories.includes('Category 4');
                expect(hasCat).toBeTruthy();
            });
        });
    });
});

describe('Board Layout', () => {
    describe('No Layout', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'random' },
            restrictions: [],
            adjustments: [],
        });

        it('Generates an full board of randomized selections', () => {
            generator.generateBoardLayout();
            const layout = generator.layout;
            expect(layout).toHaveLength(5);
            expect(layout).not.toContain(1);
            layout.forEach((row) => {
                row.forEach((cell) => {
                    expect(cell.selectionCriteria).toBe('random');
                });
            });
        });
    });

    describe('Magic Square', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'srlv5' },
            restrictions: [],
            adjustments: [],
        });

        it('Generates 1-25', () => {
            generator.reset();
            generator.generateBoardLayout();
            const layout = generator.layout
                .map((row) =>
                    row.map((cell) =>
                        cell.selectionCriteria === 'difficulty'
                            ? cell.difficulty
                            : 0,
                    ),
                )
                .flat();
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
            layout.forEach((row) => {
                let sum = 0;
                row.forEach((cell) => {
                    expect(cell.selectionCriteria).toBe('difficulty');
                    if (cell.selectionCriteria !== 'difficulty') {
                        return;
                    }
                    sum += cell.difficulty;
                });
                expect(sum).toBe(magicNum);
            });

            // columns
            for (let c = 0; c < n; c++) {
                let sum = 0;
                for (let r = 0; r < n; r++) {
                    const cell = layout[r][c];
                    expect(cell.selectionCriteria).toBe('difficulty');
                    if (cell.selectionCriteria !== 'difficulty') {
                        return;
                    }
                    sum += cell.difficulty;
                }
            }

            // diagonals
            expect(
                (layout[0][0].selectionCriteria === 'difficulty'
                    ? layout[0][0].difficulty
                    : 0) +
                    (layout[1][1].selectionCriteria === 'difficulty'
                        ? layout[1][1].difficulty
                        : 0) +
                    (layout[2][2].selectionCriteria === 'difficulty'
                        ? layout[2][2].difficulty
                        : 0) +
                    (layout[3][3].selectionCriteria === 'difficulty'
                        ? layout[3][3].difficulty
                        : 0) +
                    (layout[4][4].selectionCriteria === 'difficulty'
                        ? layout[4][4].difficulty
                        : 0),
            ).toBe(magicNum);
            expect(
                (layout[0][4].selectionCriteria === 'difficulty'
                    ? layout[0][4].difficulty
                    : 0) +
                    (layout[1][3].selectionCriteria === 'difficulty'
                        ? layout[1][3].difficulty
                        : 0) +
                    (layout[2][2].selectionCriteria === 'difficulty'
                        ? layout[2][2].difficulty
                        : 0) +
                    (layout[3][1].selectionCriteria === 'difficulty'
                        ? layout[3][1].difficulty
                        : 0) +
                    (layout[4][0].selectionCriteria === 'difficulty'
                        ? layout[4][0].difficulty
                        : 0),
            ).toBe(magicNum);
        });

        it('Generates the same square given a seed', () => {
            generator.reset(12345);
            generator.generateBoardLayout();
            const layout = generator.layout;
            const expected = [
                [19, 12, 1, 10, 23],
                [6, 25, 18, 14, 2],
                [13, 4, 7, 21, 20],
                [22, 16, 15, 3, 9],
                [5, 8, 24, 17, 11],
            ];
            for (let r = 0; r < expected.length; r++) {
                for (let c = 0; c < expected[r].length; c++) {
                    const cell = layout[r][c];
                    expect(cell.selectionCriteria === 'difficulty');
                    if (cell.selectionCriteria !== 'difficulty') {
                        return;
                    }
                    expect(cell.difficulty).toEqual(expected[r][c]);
                }
            }
        });
    });

    describe('Static Placement (Isaac)', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'isaac' },
            restrictions: [],
            adjustments: [],
        });

        const one: LayoutCell = {
            selectionCriteria: 'difficulty',
            difficulty: 1,
        };
        const two: LayoutCell = {
            selectionCriteria: 'difficulty',
            difficulty: 2,
        };
        const three: LayoutCell = {
            selectionCriteria: 'difficulty',
            difficulty: 3,
        };
        const four: LayoutCell = {
            selectionCriteria: 'difficulty',
            difficulty: 4,
        };
        const correctLayout = [
            [two, three, one, one, two],
            [three, one, two, two, one],
            [one, two, four, two, one],
            [two, one, two, one, three],
            [one, two, one, three, two],
        ];

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

describe('Goal Selection', () => {
    const generator = new BoardGenerator(goals, categories, {
        goalFilters: [],
        goalTransformation: [],
        boardLayout: { mode: 'srlv5' },
        restrictions: [{ type: 'line-type-exclusion' }],
        adjustments: [],
    });

    it('Selects correctly based on category', () => {
        generator.reset();
        generator.layout = [[{ selectionCriteria: 'category', category: '0' }]];
        const goals = generator.validGoalsForCell(0, 0);
        goals.forEach((goal) => {
            expect(goal.categories).toContain('Category 1');
        });
    });

    it('Selects correctly based on difficulty', () => {
        generator.reset();
        generator.layout = [
            [
                { selectionCriteria: 'difficulty', difficulty: 12 },
                { selectionCriteria: 'difficulty', difficulty: 21 },
                { selectionCriteria: 'difficulty', difficulty: 7 },
            ],
        ];
        let goals = generator.validGoalsForCell(0, 0);
        goals.forEach((goal) => {
            expect(goal.difficulty).toBe(12);
        });
        goals = generator.validGoalsForCell(0, 1);
        goals.forEach((goal) => {
            expect(goal.difficulty).toBe(21);
        });
        goals = generator.validGoalsForCell(0, 2);
        goals.forEach((goal) => {
            expect(goal.difficulty).toBe(7);
        });
    });

    it('Selects correctly based on mixed layout criteria', () => {
        generator.reset();
        generator.layout = [
            [
                { selectionCriteria: 'category', category: '2' },
                { selectionCriteria: 'difficulty', difficulty: 21 },
            ],
            [
                { selectionCriteria: 'difficulty', difficulty: 7 },
                { selectionCriteria: 'category', category: '5' },
            ],
        ];
        let goals = generator.validGoalsForCell(0, 0);
        goals.forEach((goal) => {
            expect(goal.categories).toContain('Category 3');
        });
        goals = generator.validGoalsForCell(0, 1);
        goals.forEach((goal) => {
            expect(goal.difficulty).toBe(21);
        });
        goals = generator.validGoalsForCell(1, 0);
        goals.forEach((goal) => {
            expect(goal.difficulty).toBe(7);
        });
        goals = generator.validGoalsForCell(1, 1);
        goals.forEach((goal) => {
            expect(goal.categories).toContain('Category 6');
        });
    });
});

describe('Goal Restriction', () => {
    describe('Line Type Exclusion', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'srlv5' },
            restrictions: [{ type: 'line-type-exclusion' }],
            adjustments: [],
        });

        it('Prefers to place goals of differing types in the same row', () => {
            generator.reset();
            generator.generateBoardLayout();
            let goals = generator.validGoalsForCell(0, 0);
            const g = goals.pop();
            if (!g) {
                return fail();
            }
            generator.board[0] = [];
            generator.board[0][0] = g;
            let restrictedGoals = generator.validGoalsForCell(0, 1);
            // the sample goals only have one category each so we can just
            // expect categories[0] to not equal
            restrictedGoals.forEach((r) => {
                expect(r.categories[0]).not.toEqual(g.categories[0]);
            });

            restrictedGoals = generator.validGoalsForCell(1, 0);
            restrictedGoals.forEach((r) => {
                expect(r.categories[0]).not.toEqual(g.categories[0]);
            });

            restrictedGoals = generator.validGoalsForCell(2, 2);
            restrictedGoals.forEach((r) => {
                expect(r.categories[0]).not.toEqual(g.categories[0]);
            });
        });
    });
});

describe('Global Adjustments', () => {
    describe('Synergize', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'srlv5' },
            restrictions: [],
            adjustments: [{ type: 'synergize' }],
        });

        it('Duplicates goals that share a category', () => {
            generator.reset();
            generator.adjustGoalList(goals[0]);
            expect(generator.goalCopies[goals[1].id]).toBe(2);
        });

        it('Duplicates multiple goals in group', () => {
            generator.reset();
            generator.adjustGoalList(goals[0]);
            expect(generator.goalCopies[goals[1].id]).toBe(2);
            expect(generator.goalCopies[goals[8].id]).toBe(2);
            expect(generator.goalCopies[goals[15].id]).toBe(2);
            expect(generator.goalCopies[goals[22].id]).toBe(2);
            expect(generator.goalCopies[goals[29].id]).toBe(2);
        });

        it('Duplicates a goal with multiple shared categories multiple times', () => {
            generator.reset();
            generator.adjustGoalList(goals[0]);
            expect(generator.goalCopies[goals[7].id]).toBe(3);
            expect(generator.goalCopies[goals[14].id]).toBe(3);
            expect(generator.goalCopies[goals[21].id]).toBe(3);
        });

        it('Does not duplicate goals that share no categories', () => {
            generator.reset();
            generator.adjustGoalList(goals[0]);
            expect(generator.goalCopies[goals[2].id]).toBe(1);
            expect(generator.goalCopies[goals[1].id]).toBe(2);
            expect(generator.goalCopies[goals[3].id]).toBe(1);
            expect(generator.goalCopies[goals[4].id]).toBe(1);
            expect(generator.goalCopies[goals[7].id]).toBe(3);
            expect(generator.goalCopies[goals[5].id]).toBe(1);
            expect(generator.goalCopies[goals[14].id]).toBe(3);
            expect(generator.goalCopies[goals[8].id]).toBe(2);
            expect(generator.goalCopies[goals[11].id]).toBe(1);
        });

        it('Does not re-add the original goal to the list', () => {
            generator.reset();
            generator.adjustGoalList(goals[0]);
            expect(generator.goalCopies[goals[0].id]).toBe(0);
        });
    });

    describe('Max Goals of Type in Board', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'srlv5' },
            restrictions: [],
            adjustments: [{ type: 'board-type-max' }],
        });

        it('Adjusts the maximums in global state', () => {
            generator.reset();
            const cat = categories[1].name;
            generator.categoryMaxes[cat] = 1;
            generator.adjustGoalList(goals[0]);
            expect(generator.categoryMaxes[cat]).toBe(0);
        });

        it('Removes all goals with a category after reaching 0', () => {
            generator.reset();
            const cat = categories[1].name;
            generator.categoryMaxes[cat] = 1;
            generator.adjustGoalList(goals[0]);
            expect(generator.goalCopies[goals[0].id]).toBe(0);
            expect(generator.goalCopies[goals[1].id]).toBe(0);
        });

        it('Does not remove goals with no matching category', () => {
            generator.reset();
            const cat = categories[1].name;
            generator.categoryMaxes[cat] = 1;
            generator.adjustGoalList(goals[0]);
            expect(generator.goalCopies[goals[11].id]).toBe(1);
            expect(generator.goalCopies[goals[19].id]).toBe(1);
        });

        it('Does not re-add the original goal to the list', () => {
            generator.reset();
            generator.adjustGoalList(goals[0]);
            expect(generator.goalCopies[goals[0].id]).toBe(0);
        });
    });

    it('Removes the placed goal from the goal list', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'random' },
            restrictions: [],
            adjustments: [],
        });
        generator.reset();
        generator.adjustGoalList(goals[0]);
        expect(generator.goalCopies[goals[0].id]).toBe(0);
    });
});

describe('Full Generation', () => {
    it('Successfully generates a fully random board', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'random' },
            restrictions: [],
            adjustments: [],
        });
        generator.reset();
        expect(() => generator.generateBoard()).not.toThrow();
        expect(generator.board).toHaveLength(5);
        expect(generator.board[0]).toHaveLength(5);
        expect(generator.board[1]).toHaveLength(5);
        expect(generator.board[2]).toHaveLength(5);
        expect(generator.board[3]).toHaveLength(5);
        expect(generator.board[4]).toHaveLength(5);
    });

    it('Successfully generates an SRLv5 style board', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'srlv5' },
            restrictions: [{ type: 'line-type-exclusion' }],
            adjustments: [],
        });
        generator.reset();
        expect(() => generator.generateBoard()).not.toThrow();
        expect(generator.board).toHaveLength(5);
        expect(generator.board[0]).toHaveLength(5);
        expect(generator.board[1]).toHaveLength(5);
        expect(generator.board[2]).toHaveLength(5);
        expect(generator.board[3]).toHaveLength(5);
        expect(generator.board[4]).toHaveLength(5);
    });

    it('Generates the same board given the same seed (Random)', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'random' },
            restrictions: [],
            adjustments: [],
        });
        generator.reset(12345);
        generator.generateBoard();
        const board1 = generator.board;
        generator.reset(12345);
        generator.generateBoard();
        const board2 = generator.board;
        expect(board1).toEqual(board2);
    });

    it('Generates the same board given the same seed (SRLv5)', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'srlv5' },
            restrictions: [{ type: 'line-type-exclusion' }],
            adjustments: [],
        });
        generator.reset(12345);
        generator.generateBoard();
        const board1 = generator.board;
        generator.reset(12345);
        generator.generateBoard();
        const board2 = generator.board;
        expect(board1).toEqual(board2);
    });

    it('Generates a board with maximum restrictions', () => {
        const generator = new BoardGenerator(goals, categories, {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'srlv5' },
            restrictions: [{ type: 'line-type-exclusion' }],
            adjustments: [{ type: 'board-type-max' }],
        });
        generator.reset();
        expect(() => {
            generator.generateBoard();
        }).not.toThrow();
    });
});
