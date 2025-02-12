'use server';

import { serverFetch } from '../app/ServerUtils';

export async function forgotPassword(email: string, username: string) {
    const res = await serverFetch('/api/auth/forgotPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username }),
    });

    if (!res.ok) {
        return { ok: false, status: res.status, message: await res.text() };
    }
    return {
        ok: true,
        status: res.status,
    };
}

export async function resetPassword(token: string, password: string) {
    const res = await serverFetch('/api/auth/resetPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
    });

    if (!res.ok) {
        return { ok: false, status: res.status, message: await res.text() };
    }
    return {
        ok: true,
        status: res.status,
    };
}
