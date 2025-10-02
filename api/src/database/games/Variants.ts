import { GeneratorSettings } from '@playbingo/shared';
import { prisma } from '../Database';
import { Prisma } from '@prisma/client';

export const createVariant = (
    slug: string,
    name: string,
    generatorSettings: GeneratorSettings,
    description?: string,
) => {
    return prisma.variant.create({
        data: {
            name,
            description: description || '',
            generatorSettings,
            game: { connect: { slug } },
        },
    });
};

export const updateVariant = (
    id: string,
    { name, description, generatorSettings }: Prisma.VariantUpdateInput,
) => {
    return prisma.variant.update({
        data: {
            name,
            description: description || '',
            generatorSettings,
        },
        where: { id },
    });
};

export const deleteVariant = (id: string) => {
    return prisma.variant.delete({
        where: { id },
    });
};

export const getVariant = (id: string) => {
    return prisma.variant.findUnique({
        where: { id },
    });
};
