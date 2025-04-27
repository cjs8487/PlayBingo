'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '../app/ServerUtils';

interface ProfileUpdateOptions {
    username?: string;
    email?: string;
    avatar?: string;
    shouldRemoveAvatar?: boolean;
}

export async function updateProfile(
    id: string,
    { username, email, avatar, shouldRemoveAvatar }: ProfileUpdateOptions,
) {
    const res = await serverFetch(`api/users/${id}`, {
        method: 'POST',
        body: JSON.stringify({ username, email, avatar, shouldRemoveAvatar }),
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

export async function changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
): Promise<
    | {
          ok: false;
          status: number;
          message: string;
      }
    | { ok: true; status: number }
> {
    const res = await serverFetch(`/api/users/${id}/changePassword`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
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
