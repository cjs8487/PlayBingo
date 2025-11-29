import { GoalImageTag } from '@prisma/client';
import { prisma } from '../Database';

export const getTags = async (slug: string) => {
    return prisma.goalImageTag.findMany({ where: { game: { slug } } });
};

export const getTag = async (id: string) => {
    return prisma.goalImageTag.findUnique({ where: { id } });
};

export const createTag = async (
    gameSlug: string,
    label: string,
    color: string,
) => {
    return prisma.goalImageTag.create({
        data: {
            label,
            color,
            game: { connect: { slug: gameSlug } },
        },
    });
};

export const updateTag = async (
    id: string,
    data: { label?: string; color?: string },
) => {
    return prisma.goalImageTag.update({ where: { id }, data });
};

export const deleteTag = async (id: string) => {
    return prisma.goalImageTag.delete({ where: { id } });
};

export const gameSlugForTag = async (id: string) =>
    (
        await prisma.goalImageTag.findUnique({
            where: { id },
            select: { game: { select: { slug: true } } },
        })
    )?.game.slug;
