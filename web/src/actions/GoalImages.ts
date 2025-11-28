'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '../app/ServerUtils';

export const createImage = async (
    slug: string,
    image: string,
    name: string,
) => {
    const res = await serverFetch(`/api/games/${slug}/images`, {
        method: 'POST',
        body: JSON.stringify({
            image,
            name,
        }),
    });

    revalidatePath(`/api/games/${slug}/images`);

    if (!res.ok) {
        return {
            ok: false,
            status: res.status,
            message: await res.text(),
        };
    }
    return {
        ok: true,
        status: res.status,
    };
};

export const updateImage = async (
    slug: string,
    id: string,
    { image, name }: { image?: string; name?: string },
) => {
    if (!image && !name) {
        return {
            ok: false,
            status: 400,
            message: 'No changes provided',
        };
    }

    const res = await serverFetch(`/api/games/${slug}/images/${id}`, {
        method: 'POST',
        body: JSON.stringify({
            image,
            name,
        }),
    });

    revalidatePath(`/api/games/${slug}/images`);

    if (!res.ok) {
        return {
            ok: false,
            status: res.status,
            message: await res.text(),
        };
    }
    return {
        ok: true,
        status: res.status,
    };
};

export const deleteImage = async (slug: string, id: string) => {
    const res = await serverFetch(`/api/games/${slug}/images/${id}`, {
        method: 'DELETE',
    });

    revalidatePath(`/api/games/${slug}/images`);

    if (!res.ok) {
        return {
            ok: false,
            status: res.status,
            message: await res.text(),
        };
    }
    return {
        ok: true,
        status: res.status,
    };
};
