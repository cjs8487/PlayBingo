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

export async function deleteLanguage(slug: string, lang: string) {
    const res = await serverFetch(`/api/games/${slug}/translations`, {
        method: 'DELETE',
        body: JSON.stringify({ translations: [lang] }),
    });

    revalidatePath(`/api/games/${slug}/translations`);

    return {
        ok: res.ok,
        status: res.status,
    };
}
