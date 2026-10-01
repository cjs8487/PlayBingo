import request from 'supertest';
import { app } from '../../../main';
import { racetimeClientId, racetimeHost } from '../../../Environment';

describe('GET /api/connect/racetime', () => {
    it('302 to the racetime OAuth authorization URL', async () => {
        const res = await request(app).get('/api/connect/racetime');
        expect(res.status).toBe(302);
        expect(res.headers.location).toContain(racetimeHost);
        expect(res.headers.location).toContain(`client_id=${racetimeClientId}`);
        expect(res.headers.location).toContain('response_type=code');
        expect(res.headers.location).toContain(
            'scope=read+race_action+create_race',
        );
    });
});
