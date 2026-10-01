import request from 'supertest';
import { app } from '../../../main';
import { getUser } from '../../../database/Users';
import {
    activateToken,
    createApiToken,
    deactivateToken,
    getAllTokens,
    revokeToken,
} from '../../../database/auth/ApiTokens';
import {
    getTestSessionCookie,
    requiresApiToken,
    requiresStaff,
} from '../../shared';

let playerCookie = '';
let staffCookie = '';

beforeAll(async () => {
    [playerCookie, staffCookie] = await Promise.all([
        getTestSessionCookie('player'),
        getTestSessionCookie('staff'),
    ]);
});

describe('GET /api/tokens', () => {
    requiresApiToken((token) => {
        let req = request(app).get('/api/tokens');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req;
    });

    requiresStaff((cookie) => {
        let req = request(app)
            .get('/api/tokens')
            .set('PlayBingo-Api-Key', 'token');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req;
    });

    it('200 and returns tokens when user is staff', async () => {
        const mockTokens = [{ id: 'token-1', name: 'Test Key', active: true }];
        (getAllTokens as jest.Mock).mockResolvedValueOnce(mockTokens);

        const res = await request(app)
            .get('/api/tokens')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', staffCookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockTokens);
    });
});

describe('POST /api/tokens', () => {
    requiresApiToken((token) => {
        let req = request(app).post('/api/tokens');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req.send({ name: 'New Token' });
    });

    requiresStaff((cookie) => {
        let req = request(app)
            .post('/api/tokens')
            .set('PlayBingo-Api-Key', 'token')
            .send({ name: 'New Token' });
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req;
    });

    it('400 when name is not a string', async () => {
        const res = await request(app)
            .post('/api/tokens')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', staffCookie)
            .send({ name: 123 });
        expect(res.status).toBe(400);
        expect(createApiToken).not.toHaveBeenCalled();
    });

    it('200 and creates token when valid', async () => {
        const res = await request(app)
            .post('/api/tokens')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', staffCookie)
            .send({ name: 'My Key' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({ name: 'My Key', active: true }),
        );
        expect(createApiToken).toHaveBeenCalledWith('My Key');
    });
});

describe('POST /api/tokens/:id', () => {
    requiresApiToken((token) => {
        let req = request(app).post('/api/tokens/token-1');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req.send({ active: true });
    });

    requiresStaff((cookie) => {
        let req = request(app)
            .post('/api/tokens/token-1')
            .set('PlayBingo-Api-Key', 'token')
            .send({ active: true });
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req;
    });

    it('404 when token does not exist', async () => {
        const res = await request(app)
            .post('/api/tokens/missing-id')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', staffCookie)
            .send({ active: true });
        expect(res.status).toBe(404);
    });

    it('400 when active is not boolean', async () => {
        const res = await request(app)
            .post('/api/tokens/token-1')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', staffCookie)
            .send({ active: 'yes' });
        expect(res.status).toBe(400);
    });

    it('200 and activates token when active=true', async () => {
        const res = await request(app)
            .post('/api/tokens/token-1')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', staffCookie)
            .send({ active: true });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({ id: 'token-1', active: true }),
        );
        expect(activateToken).toHaveBeenCalledWith('token-1');
    });

    it('200 and deactivates token when active=false', async () => {
        const res = await request(app)
            .post('/api/tokens/token-1')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', staffCookie)
            .send({ active: false });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({ id: 'token-1', active: false }),
        );
        expect(deactivateToken).toHaveBeenCalledWith('token-1');
    });
});

describe('DELETE /api/tokens/:id', () => {
    requiresApiToken((token) => {
        let req = request(app).delete('/api/tokens/token-1');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req;
    });

    requiresStaff((cookie) => {
        let req = request(app)
            .delete('/api/tokens/token-1')
            .set('PlayBingo-Api-Key', 'token');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req;
    });

    it('404 when token does not exist', async () => {
        const res = await request(app)
            .delete('/api/tokens/missing-id')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', staffCookie);
        expect(res.status).toBe(404);
    });

    it('200 and revokes token when valid', async () => {
        const res = await request(app)
            .delete('/api/tokens/token-1')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', staffCookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                id: 'token-1',
                revokedOn: expect.any(String),
            }),
        );
        expect(revokeToken).toHaveBeenCalledWith('token-1');
    });
});
