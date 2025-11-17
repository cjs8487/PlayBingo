import { Test } from 'supertest';
import { mockFindToken } from './setup';

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
