'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '../app/ServerUtils';

interface GameResponseBase {
    ok: boolean;
    status: number;
}

interface GameErrorResponse extends GameResponseBase {
    ok: false;
    error: string;
}

interface GamePermissionSuccessResposne extends GameResponseBase {
    ok: true;
}

export type GamePermissionResponse =
    | GamePermissionSuccessResposne
    | GameErrorResponse;

export async function addOwners(
    slug: string,
    users: string[],
): Promise<GamePermissionResponse> {
    const res = await serverFetch(`/api/games/${slug}/owners`, {
        method: 'POST',
        body: JSON.stringify({ users }),
    });
    if (!res.ok) {
        const error = await res.text();
        return { ok: false, status: res.status, error };
    }

    revalidatePath(`/api/games/${slug}`);
    revalidatePath(`/api/games/${slug}/eligibleMods`);

    return { ok: true, status: res.status };
}

export async function removeOwner(
    slug: string,
    userId: string,
): Promise<GamePermissionResponse> {
    const res = await serverFetch(`/api/games/${slug}/owners`, {
        method: 'DELETE',
        body: JSON.stringify({
            user: userId,
        }),
    });
    if (!res.ok) {
        const error = await res.text();
        return { ok: false, status: res.status, error };
    }

    revalidatePath(`/api/games/${slug}`);
    revalidatePath(`/api/games/${slug}/eligibleMods`);

    return { ok: true, status: res.status };
}

export async function addModerators(
    slug: string,
    users: string[],
): Promise<GamePermissionResponse> {
    const res = await serverFetch(`/api/games/${slug}/owners`, {
        method: 'POST',
        body: JSON.stringify({ users }),
    });
    if (!res.ok) {
        const error = await res.text();
        return { ok: false, status: res.status, error };
    }

    revalidatePath(`/api/games/${slug}`);
    revalidatePath(`/api/games/${slug}/eligibleMods`);

    return { ok: true, status: res.status };
}

export async function removeModerator(
    slug: string,
    userId: string,
): Promise<GamePermissionResponse> {
    const res = await serverFetch(`/api/games/${slug}/moderators`, {
        method: 'DELETE',
        body: JSON.stringify({
            user: userId,
        }),
    });
    if (!res.ok) {
        const error = await res.text();
        return { ok: false, status: res.status, error };
    }

    revalidatePath(`/api/games/${slug}`);
    revalidatePath(`/api/games/${slug}/eligibleMods`);

    return { ok: true, status: res.status };
}
