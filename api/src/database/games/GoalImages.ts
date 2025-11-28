import e from 'cors';
import { prisma } from '../Database';

export const gameSlugForImage = async (id: string) => {
    return (
        await prisma.goalImage.findUnique({
            where: { id },
            select: { game: { select: { slug: true } } },
        })
    )?.game.slug;
};

export const createImage = (slug: string, mediaFile: string, name: string) => {
    return prisma.goalImage.create({
        data: {
            mediaFile,
            name,
            game: { connect: { slug } },
        },
    });
};

export const deleteImage = (id: string) => {
    return prisma.goalImage.delete({ where: { id } });
};

export const updateImage = (
    id: string,
    { mediaFile, name }: { mediaFile?: string; name?: string },
) => {
    return prisma.goalImage.update({
        where: { id },
        data: { mediaFile: mediaFile, name: name },
    });
};

export const getImages = (slug: string) => {
    return prisma.goalImage.findMany({ where: { game: { slug } } });
};

export const getImage = (id: string) => {
    return prisma.goalImage.findUnique({ where: { id } });
};
