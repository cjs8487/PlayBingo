import request from 'supertest';
import { app } from '../../main';
import { getUser } from '../../database/Users';
import {
    getTestSessionCookie,
    requiresApiToken,
    requiresLogin,
    requiresStaff,
} from '../shared';

describe('GET /api/me', () => {
    requiresLogin(() => request(app).get('/api/me'));

    it('403 when user is not found in database', async () => {
        const playerCookie = await getTestSessionCookie('player');
        (getUser as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app)
            .get('/api/me')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(403);
    });

    it('200 with user data when user exists', async () => {
        const playerCookie = await getTestSessionCookie('player');
        const mockUser = {
            id: 'test-user',
            username: 'testuser',
            email: 'test@plabingo.gg',
            staff: false,
        };
        (getUser as jest.Mock).mockResolvedValueOnce(mockUser);
        const res = await request(app)
            .get('/api/me')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockUser);
    });
});

describe('POST /api/logout', () => {
    requiresApiToken((token) => {
        let req = request(app).post('/api/logout');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req;
    });

    it('401 when no session is present', async () => {
        const res = await request(app)
            .post('/api/logout')
            .set('PlayBingo-Api-Key', 'token');
        expect(res.status).toBe(401);
    });

    it('200 when logged in user logs out successfully', async () => {
        const playerCookie = await getTestSessionCookie('player');
        const res = await request(app)
            .post('/api/logout')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(200);
    });
});

describe('GET /api/logs', () => {
    requiresApiToken((token) => {
        let req = request(app).get('/api/logs');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req;
    });

    requiresStaff((cookie) => {
        let req = request(app)
            .get('/api/logs')
            .set('PlayBingo-Api-Key', 'token');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req;
    });

    it('200 with log entries when user is staff', async () => {
        const staffCookie = await getTestSessionCookie('staff');
        (getUser as jest.Mock).mockResolvedValueOnce({
            id: 'test-user-staff',
            staff: true,
        });

        const res = await request(app)
            .get('/api/logs')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', staffCookie);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
