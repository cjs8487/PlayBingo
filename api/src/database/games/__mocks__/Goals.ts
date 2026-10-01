import { Game, Goal } from '@prisma/client';
import { mock } from 'jest-mock-extended';

export const mockGame = mock<Game>();
mockGame.id = '1';
mockGame.slug = 'test-game';

export const mockGoals = Array(25)
    .fill(0)
    .map((_, i) => {
        const goal = mock<Goal & { categories: any[]; tags: any[] }>();
        goal.id = `${i + 1}`;
        goal.goal = `Goal ${i + 1}`;
        goal.difficulty = (i % 25) + 1;
        goal.categories = [];
        goal.tags = [];
        return goal;
    });

export const mockSingleGoal = mock<Goal>();
mockSingleGoal.id = 'g1';
mockSingleGoal.goal = 'Goal 1';

export const editGoal = jest.fn(async (id: number | string, data: any) => true);
export const deleteGoal = jest.fn(async (id: number | string) => true);

export const gameForGoal = jest.fn(async (goalId: number | string) => {
    const idStr = String(goalId);
    if (
        idStr === 'non-existent' ||
        idStr === 'invalid' ||
        goalId === 'invalid'
    ) {
        return null;
    }
    return mockGame;
});

export const createGoal = jest.fn(
    async (
        slug: string,
        goal: string,
        description?: string,
        categories?: string[],
        difficulty?: number,
    ) => ({
        ...mockSingleGoal,
        goal,
        description,
        difficulty,
    }),
);
export const createGoals = jest.fn(
    async (slug: string, goals: any[]) => mockGoals,
);
export const replaceAllGoalsForGame = jest.fn(
    async (slug: string, goals: any[]) => true,
);
export const goalsForGameFull = jest.fn(async (slug: string) => mockGoals);
export const goalsForGame = jest.fn(async (slug: string) => mockGoals);
export const getGoalList = jest.fn(async (ids: string[]) =>
    mockGoals.filter((goal) => ids.includes(goal.id)),
);
export const deleteAllGoalsForGame = jest.fn(async (slug: string) => true);
