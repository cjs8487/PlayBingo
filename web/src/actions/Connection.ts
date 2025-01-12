'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '../app/ServerUtils';

export async function disconnectRacetime() {
    const res = await serverFetch('/api/connection/disconnect/racetime', {
        method: 'POST',
    });

    revalidatePath('/api/connection/racetime');

    return {
        ok: res.ok,
        status: res.status,
    };
}
