import { prisma } from '../Database';

export const createCateogry = (
    name: string,
    gameSlug: string,
    max?: number,
) => {
    return prisma.category.create({
        data: { name, max, game: { connect: { slug: gameSlug } } },
    });
};

export const getCategories = (gameSlug: string) => {
    return prisma.category.findMany({
        select: {
            id: true,
            name: true,
            max: true,
            _count: {
                select: { goals: true },
            },
        },
        where: { game: { slug: gameSlug } },
    });
};

interface CategoryUpdateInput {
    name?: string;
    max?: number;
}

export const updateCategory = (id: string, data: CategoryUpdateInput) => {
    return prisma.category.update({ data, where: { id } });
};

export const deleteCategory = (id: string) => {
    return prisma.category.delete({ where: { id } });
};

export const getCategory = (id: string) => {
    return prisma.category.findUnique({
        include: { game: { select: { slug: true } } },
        where: { id },
    });
};
