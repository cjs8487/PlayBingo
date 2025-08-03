import { prisma } from './Database';

export const addCommentToRoom = (
    roomId: string,
    comment: string,
    userId?: string,
) => {
    return prisma.comment.create({
        data: {
            comment,
            room: { connect: { id: roomId } },
            user: userId ? { connect: { id: userId } } : undefined,
        },
    });
};

export const addCommentToGame = (
    gameId: string,
    comment: string,
    userId?: string,
) => {
    return prisma.comment.create({
        data: {
            comment,
            game: { connect: { id: gameId } },
            user: userId ? { connect: { id: userId } } : undefined,
        },
    });
};

export const addCommentToGoal = (
    goalId: string,
    comment: string,
    userId?: string,
) => {
    return prisma.comment.create({
        data: {
            comment,
            goal: { connect: { id: goalId } },
            user: userId ? { connect: { id: userId } } : undefined,
        },
    });
};
