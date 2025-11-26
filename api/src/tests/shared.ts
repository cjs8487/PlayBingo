import request, { Test } from 'supertest';
import { mockFindToken } from './setup';
import { app } from '../main';
import { isModerator, isOwner } from '../database/games/Games';

export const getTestSessionCookie = async () => {
    const res = await request(app).get('/test/login');
    const cookie = res.headers['set-cookie'];
    return cookie;
};

export const requiresLogin = (makeRequest: () => Test) => {
    describe('Requires Login', () => {
        it('401 when no session', async () => {
            const res = await makeRequest();
            expect(res.status).toBe(401);
        });
    });
};

export const requiresGameModerator = (
    makeRequest: (cookie?: string) => Test,
) => {
    describe('Requires Game Moderator', () => {
        it('401 when no session', async () => {
            const res = await makeRequest();
            expect(isModerator).not.toHaveBeenCalled();
            expect(isOwner).not.toHaveBeenCalled();
            expect(res.status).toBe(401);
        });

        it('403 when normal user', async () => {
            const cookie = await getTestSessionCookie();
            console.log(cookie);
            const res = await makeRequest(cookie);
            expect(isModerator).toHaveBeenCalled();
            expect(isOwner).not.toHaveBeenCalled();
            expect(res.status).toBe(403);
        });
    });
};

export const requiresGameOwner = (makeRequest: (cookie?: string) => Test) => {
    describe('Requires Game Owner', () => {
        it('401 when no session', async () => {
            const res = await makeRequest();
            expect(res.status).toBe(401);
        });
    });

    it('403 when normal user', async () => {
        const cookie = await getTestSessionCookie();
        const res = await makeRequest(cookie);
        expect(isModerator).toHaveBeenCalled();
        expect(isOwner).not.toHaveBeenCalled();
        expect(res.status).toBe(403);
    });

    it('403 when moderator', async () => {
        const cookie = await getTestSessionCookie();
        const res = await makeRequest(cookie);
        expect(isModerator).toHaveBeenCalled();
        expect(isOwner).not.toHaveBeenCalled();
        expect(res.status).toBe(403);
    });
};

export const requiresStaff = (makeRequest: () => Test) => {
    describe('Requires Staff', () => {
        it('401 when no session', async () => {
            const res = await makeRequest();
            expect(res.status).toBe(401);
            expect(isModerator).not.toHaveBeenCalled();
        });
    });
};

export const requiresApiToken = (makeRequest: (token?: string) => Test) => {
    describe('API Token', () => {
        it('401 when no token', async () => {
            const res = await makeRequest();
            expect(mockFindToken).not.toHaveBeenCalled();
            expect(res.status).toBe(401);
        });
        it('401 when invalid token', async () => {
            const res = await makeRequest('invalid');
            expect(mockFindToken).toHaveBeenCalled();
            expect(res.status).toBe(401);
        });
        it('401 when revoked token', async () => {
            const res = await makeRequest('revoked');
            expect(mockFindToken).toHaveBeenCalled();
            expect(res.status).toBe(401);
        });
    });
};
