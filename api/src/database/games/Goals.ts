import { Prisma } from '@prisma/client';
import { prisma } from '../Database';
import { logError } from '../../Logger';
import { gameForSlug } from './Games';

export const goalsForGame = async (slug: string) => {
    const goals = await prisma.goal.findMany({
        where: { game: { slug } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { categories: { orderBy: { name: 'asc' } } },
    });

    return goals.map((g) => ({
        ...g,
        categories: g.categories.map((c) => c.name),
    }));
};

export const goalsForGameFull = (slug: string) => {
    return prisma.goal.findMany({
        where: { game: { slug } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { categories: { orderBy: { name: 'asc' } } },
    });
};

export const createGoal = async (
    gameSlug: string,
    goal: string,
    description?: string,
    categories?: string[],
    difficulty?: number,
) => {
    const gameId = (await gameForSlug(gameSlug))?.id;
    if (!gameId) {
        return undefined;
    }

    return prisma.goal.create({
        data: {
            goal,
            description,
            categories: {
                connectOrCreate: categories?.map((cat) => ({
                    create: {
                        name: cat,
                        game: { connect: { slug: gameSlug } },
                    },
                    where: {
                        gameId_name: {
                            gameId,
                            name: cat,
                        },
                    },
                })),
            },
            difficulty,
            game: { connect: { slug: gameSlug } },
        },
    });
};

export const editGoal = async (id: string, data: Prisma.GoalUpdateInput) => {
    try {
        await prisma.goal.update({ where: { id }, data });
        return true;
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === 'P2001') {
                return false;
            }
            logError(`Database Known Client error - ${e.message}`);
        }
        logError(
            'An unknown error occurred while attempting a database operation',
        );
        return false;
    }
};

export const deleteGoal = async (id: string) => {
    try {
        await prisma.goal.delete({ where: { id } });
        return true;
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === 'P2001') {
                return false;
            }
            logError(`Database Known Client error - ${e.message}`);
        }
        logError(
            'An unknown error occurred while attempting a database operation',
        );
        return false;
    }
};

export type GoalInput = {
    goal: string;
    description?: string;
    categories?: string[];
    difficulty?: number;
};

export const createGoals = async (slug: string, goals: GoalInput[]) => {
    const gameId = (await gameForSlug(slug))?.id;
    if (!gameId) {
        return undefined;
    }

    await prisma.$transaction(
        goals.map((g) =>
            prisma.goal.create({
                data: {
                    goal: g.goal,
                    description: g.description,
                    categories: {
                        connectOrCreate: g.categories?.map((cat) => ({
                            create: {
                                name: cat,
                                game: { connect: { slug: slug } },
                            },
                            where: {
                                gameId_name: {
                                    gameId,
                                    name: cat,
                                },
                            },
                        })),
                    },
                    difficulty: g.difficulty,
                    game: { connect: { slug: slug } },
                },
            }),
        ),
    );
};

/**
 * Replaces all goals for a given game within a single transaction.
 * If any create fails, the delete is rolled back as well.
 */
export const replaceAllGoalsForGame = async (
    slug: string,
    goals: GoalInput[],
) => {
    const game = await gameForSlug(slug);
    const gameId = game?.id;
    if (!gameId) {
        return false;
    }

    await prisma.$transaction(async (tx) => {
        await tx.goal.deleteMany({ where: { game: { slug } } });

        await Promise.all(
            goals.map((g) =>
                tx.goal.create({
                    data: {
                        goal: g.goal,
                        description: g.description,
                        categories: {
                            connectOrCreate: g.categories?.map((cat) => ({
                                create: {
                                    name: cat,
                                    game: { connect: { slug } },
                                },
                                where: {
                                    gameId_name: {
                                        gameId,
                                        name: cat,
                                    },
                                },
                            })),
                        },
                        difficulty: g.difficulty ?? undefined,
                        game: { connect: { id: gameId } },
                    },
                }),
            ),
        );
    });

    return true;
};

export const gameForGoal = async (goalId: string) => {
    const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
            game: true,
        },
    });

    return goal?.game;
};

export const deleteAllGoalsForGame = async (gameSlug: string) => {
    try {
        await prisma.goal.deleteMany({
            where: { game: { slug: gameSlug } },
        });
        return true;
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            logError(`Database Known Client error - ${e.message}`);
        } else {
            logError(
                'An unknown error occurred while attempting a database operation',
            );
        }
        return false;
    }
};

export const getGoalList = async (ids: string[]) => {
    if (ids.length === 0) {
        return [];
    }
    const goals = await prisma.goal.findMany({ where: { id: { in: ids } } });
    const map = new Map(goals.map((goal) => [goal.id, goal]));
    return ids.map((id) => map.get(id)).filter((v) => !!v);
};
