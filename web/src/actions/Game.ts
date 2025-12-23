'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '../app/ServerUtils';

export async function deleteCategory(slug: string, categoryId: string) {
    const res = await serverFetch(`/api/goals/categories/${categoryId}`, {
        method: 'DELETE',
    });

    revalidatePath(`/api/goals/${slug}/categories`);

    return {
        ok: res.ok,
        status: res.status,
    };
}

export async function deleteTag(slug: string, tagId: string) {
    const res = await serverFetch(`/api/goals/tags/${tagId}`, {
        method: 'DELETE',
    });

    revalidatePath(`/api/goals/${slug}/tags`);

    return {
        ok: res.ok,
        status: res.status,
    };
}
