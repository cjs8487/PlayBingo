import { GeneratorConfig } from '@playbingo/shared';
import { prisma } from '../Database';
import { Prisma } from '@prisma/client';

export const createVariant = (
    slug: string,
    name: string,
    generatorConfig: GeneratorConfig,
    description?: string,
) => {
    return prisma.variant.create({
        data: {
            name,
            description: description || '',
            generatorConfig,
            game: { connect: { slug } },
        },
    });
};

export const updateVariant = (
    id: string,
    { name, description, generatorConfig }: Prisma.VariantUpdateInput,
) => {
    return prisma.variant.update({
        data: {
            name,
            description: description || '',
            generatorConfig,
        },
        where: { id },
    });
};

export const deleteVariant = (id: string) => {
    return prisma.variant.delete({
        where: { id },
    });
};
