'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '../app/ServerUtils';

export async function deleteCategory(slug: string, categoryId: string) {
    const res = await serverFetch(`/api/goals/categories/${categoryId}`, {
        method: 'DELETE',
    });

    revalidatePath(`/api/games/${slug}/categories`);

    return {
        ok: res.ok,
        status: res.status,
    };
}

export async function createTag(slug: string, name: string) {
    const res = await serverFetch(`/api/games/${slug}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });

    if (!res.ok) {
        return {
            ok: res.ok,
            status: res.status,
            message: await res.text(),
        };
    }

    revalidatePath(`/api/games/${slug}/tags`);

    return {
        ok: res.ok,
        status: res.status,
    };
}

export async function updateTag(slug: string, tagId: string, name: string) {
    const res = await serverFetch(`/api/games/${slug}/tags/${tagId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });

    if (!res.ok) {
        return {
            ok: res.ok,
            status: res.status,
            message: await res.text(),
        };
    }

    revalidatePath(`/api/games/${slug}/tags`);

    return {
        ok: res.ok,
        status: res.status,
    };
}

export async function deleteTag(slug: string, tagId: string) {
    const res = await serverFetch(`/api/games/${slug}/tags/${tagId}`, {
        method: 'DELETE',
    });

    revalidatePath(`/api/games/${slug}/tags`);

    return {
        ok: res.ok,
        status: res.status,
    };
}
