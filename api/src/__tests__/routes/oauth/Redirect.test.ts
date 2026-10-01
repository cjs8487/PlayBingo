import request from 'supertest';
import { app } from '../../../main';
import { clientUrl } from '../../../Environment';
import { getAccessToken, registerUser } from '../../../lib/RacetimeConnector';
import { createRacetimeConnection } from '../../../database/Connections';
import { getTestSessionCookie } from '../../shared';

jest.mock('../../../lib/RacetimeConnector', () => ({
    getAccessToken: jest.fn(),
    registerUser: jest.fn(),
}));

afterEach(() => {
    jest.restoreAllMocks();
});

describe('GET /api/oauth/redirect/racetime', () => {
    it('302 with an error when there is no session user', async () => {
        const res = await request(app).get('/api/oauth/redirect/racetime');
        expect(res.status).toBe(302);
        expect(decodeURIComponent(res.headers.location)).toBe(
            `${clientUrl}?type=error&message=Unable to connect account`,
        );
    });

    it('302 with an error when code is missing or not a string', async () => {
        const playerCookie = await getTestSessionCookie('player');
        const res = await request(app)
            .get('/api/oauth/redirect/racetime')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(302);
        expect(decodeURIComponent(res.headers.location)).toBe(
            `${clientUrl}?type=error&message=Unable to connect account.`,
        );
    });

    it('302 with an error when the token endpoint fails', async () => {
        const playerCookie = await getTestSessionCookie('player');
        jest.spyOn(global, 'fetch').mockResolvedValueOnce({
            ok: false,
            json: jest.fn().mockResolvedValueOnce({ error: 'invalid_grant' }),
        } as unknown as Response);

        const res = await request(app)
            .get('/api/oauth/redirect/racetime?code=sample_code')
            .set('Cookie', playerCookie);

        expect(res.status).toBe(302);
        expect(decodeURIComponent(res.headers.location)).toBe(
            `${clientUrl}?type=error&message=Unable to connect account - invalid_grant`,
        );
        expect(registerUser).not.toHaveBeenCalled();
        expect(createRacetimeConnection).not.toHaveBeenCalled();
    });

    it('302 with an error when the userinfo endpoint fails', async () => {
        const playerCookie = await getTestSessionCookie('player');
        jest.spyOn(global, 'fetch')
            .mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({
                    access_token: 'acc_tok',
                    expires_in: 36000,
                    token_type: 'Bearer',
                    scope: 'read',
                    refresh_token: 'ref_tok',
                }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: false,
            } as Response);
        (getAccessToken as jest.Mock).mockResolvedValueOnce('acc_tok');

        const res = await request(app)
            .get('/api/oauth/redirect/racetime?code=sample_code')
            .set('Cookie', playerCookie);

        expect(res.status).toBe(302);
        expect(decodeURIComponent(res.headers.location)).toBe(
            `${clientUrl}?type=error&message=Unable to connect account`,
        );
        expect(registerUser).toHaveBeenCalledWith(
            'test-user',
            'acc_tok',
            'ref_tok',
            36000,
        );
    });

    it('302 with success after linking the racetime account', async () => {
        const playerCookie = await getTestSessionCookie('player');
        jest.spyOn(global, 'fetch')
            .mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({
                    access_token: 'acc_tok',
                    expires_in: 36000,
                    token_type: 'Bearer',
                    scope: 'read',
                    refresh_token: 'ref_tok',
                }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce({
                    id: 'rt-user-789',
                    full_name: 'SpeedyRunner',
                }),
            } as unknown as Response);
        (getAccessToken as jest.Mock).mockResolvedValueOnce('acc_tok');

        const res = await request(app)
            .get('/api/oauth/redirect/racetime?code=sample_code')
            .set('Cookie', playerCookie);

        expect(res.status).toBe(302);
        expect(decodeURIComponent(res.headers.location)).toBe(
            `${clientUrl}?type=success&message=Successfully connected to racetime.gg user SpeedyRunner`,
        );
        expect(createRacetimeConnection).toHaveBeenCalledWith(
            'test-user',
            'rt-user-789',
            'ref_tok',
        );
    });
});
