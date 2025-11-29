'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '../app/ServerUtils';

export async function createImageTag(
    slug: string,
    label: string,
    color: string,
) {
    if (!label) {
        return {
            ok: false,
            status: 400,
            message: 'Missing label',
        };
    }
    if (!color) {
        return {
            ok: false,
            status: 400,
            message: 'Missing color',
        };
    }

    const res = await serverFetch(`/api/games/${slug}/imageTags`, {
        method: 'POST',
        body: JSON.stringify({
            label,
            color,
        }),
    });

    revalidatePath(`/api/games/${slug}/imageTags`);

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
}

export async function updateImageTag(
    slug: string,
    id: string,
    { label, color }: { label?: string; color?: string },
) {
    if (!label && !color) {
        return {
            ok: false,
            status: 400,
            message: 'No changes provided',
        };
    }

    const res = await serverFetch(`/api/games/${slug}/imageTags/${id}`, {
        method: 'POST',
        body: JSON.stringify({
            label,
            color,
        }),
    });

    revalidatePath(`/api/games/${slug}/imageTags`);

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
}
export async function deleteImageTag(slug: string, id: string) {
    const res = await serverFetch(`/api/games/${slug}/imageTags/${id}`, {
        method: 'DELETE',
    });

    revalidatePath(`/api/games/${slug}/imageTags`);

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
}
