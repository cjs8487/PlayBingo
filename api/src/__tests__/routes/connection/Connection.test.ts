import request from 'supertest';
import { app } from '../../../main';
import { ConnectionService } from '@prisma/client';
import {
    deleteConnection,
    getConnectionForUser,
} from '../../../database/Connections';
import {
    getTestSessionCookie,
    requiresApiToken,
    requiresLogin,
} from '../../shared';

afterEach(() => {
    jest.restoreAllMocks();
});

describe('GET /api/connection/racetime', () => {
    requiresApiToken((token) => {
        let req = request(app).get('/api/connection/racetime');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req;
    });

    requiresLogin(() => {
        return request(app)
            .get('/api/connection/racetime')
            .set('PlayBingo-Api-Key', 'token')
            .send();
    });

    it('200 with false when user has no racetime connection', async () => {
        const playerCookie = await getTestSessionCookie('player');
        (getConnectionForUser as jest.Mock).mockResolvedValueOnce(null);

        const res = await request(app)
            .get('/api/connection/racetime')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ hasRacetimeConnection: false });
    });

    it('200 with false when racetime user fetch fails', async () => {
        const playerCookie = await getTestSessionCookie('player');
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
        } as Response);

        const res = await request(app)
            .get('/api/connection/racetime')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ hasRacetimeConnection: false });
    });

    it('200 with the racetime user when fetch succeeds', async () => {
        const playerCookie = await getTestSessionCookie('player');
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({ full_name: 'SpeedyGamer' }),
        } as unknown as Response);

        const res = await request(app)
            .get('/api/connection/racetime')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            hasRacetimeConnection: true,
            racetimeUser: 'SpeedyGamer',
        });
    });
});

describe('POST /api/connection/disconnect/racetime', () => {
    requiresApiToken((token) => {
        let req = request(app).post('/api/connection/disconnect/racetime');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req;
    });

    requiresLogin(() => {
        return request(app)
            .post('/api/connection/disconnect/racetime')
            .set('PlayBingo-Api-Key', 'token')
            .send();
    });

    it('403 when no connection exists to delete', async () => {
        const playerCookie = await getTestSessionCookie('player');
        (getConnectionForUser as jest.Mock).mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/connection/disconnect/racetime')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(403);
    });

    it('403 when deleteConnection returns false', async () => {
        const playerCookie = await getTestSessionCookie('player');
        (deleteConnection as jest.Mock).mockResolvedValueOnce(false);

        const res = await request(app)
            .post('/api/connection/disconnect/racetime')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(403);
    });

    it('200 when deleteConnection succeeds', async () => {
        const playerCookie = await getTestSessionCookie('player');
        const res = await request(app)
            .post('/api/connection/disconnect/racetime')
            .set('PlayBingo-Api-Key', 'token')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(200);
        expect(deleteConnection).toHaveBeenCalledWith(
            'test-user',
            ConnectionService.RACETIME,
        );
    });
});
