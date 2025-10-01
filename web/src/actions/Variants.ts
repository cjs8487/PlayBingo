'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '../app/ServerUtils';
import { GeneratorSettings } from '@playbingo/shared';

export async function createVariant(
    slug: string,
    name: string,
    description: string,
    config: GeneratorSettings,
) {
    const res = await serverFetch(`/api/games/${slug}/variants`, {
        method: 'POST',
        body: JSON.stringify({
            name,
            description,
            config,
        }),
    });

    revalidatePath(`/games/${slug}`);
    return {
        ok: res.ok,
        status: res.status,
    };
}

export async function updateVariant(
    slug: string,
    id: string,
    name: string,
    description: string,
    config: GeneratorSettings,
) {
    const res = await serverFetch(`/api/games/${slug}/variants/${id}`, {
        method: 'POST',
        body: JSON.stringify({
            name,
            description,
            config,
        }),
    });

    revalidatePath(`/games/${slug}`);
    return {
        ok: res.ok,
        status: res.status,
    };
}

export async function deleteVariant(slug: string, id: string) {
    const res = await serverFetch(`/api/games/${slug}/variants/${id}`, {
        method: 'DELETE',
    });

    revalidatePath(`/games/${slug}`);
    return {
        ok: res.ok,
        status: res.status,
    };
}
