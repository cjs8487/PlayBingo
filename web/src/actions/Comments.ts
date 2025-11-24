'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '../app/ServerUtils';

export async function postCommentOnGoal(goalId: string, comment: string) {
    const res = await serverFetch(`/api/goals/${goalId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
    });

    revalidatePath('api/game/[id]/goals');

    return {
        ok: res.ok,
        status: res.status,
    };
}
