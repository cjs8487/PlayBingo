'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '../app/ServerUtils';

interface ProfileUpdateOptions {
    username?: string;
    email?: string;
}

export async function updateProfile(
    id: string,
    { username, email }: ProfileUpdateOptions,
) {
    const res = await serverFetch(`api/users/${id}`, {
        method: 'POST',
        body: JSON.stringify({ username, email }),
    });

    if (!res.ok) {
        return {
            ok: false,
            status: res.status,
            message: await res.text(),
        };
    }

    revalidatePath('/me');

    return { ok: true, status: res.status };
}
