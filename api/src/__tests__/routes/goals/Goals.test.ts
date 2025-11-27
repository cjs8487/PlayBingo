import request from 'supertest';
import { editGoal } from '../../../database/games/Goals';
import { app } from '../../../main';
import { getTestSessionCookie, requiresGameModerator } from '../../shared';

let cookie = '';

beforeAll(async () => {
    cookie = await getTestSessionCookie();
});

describe('POST /api/goals/:id', () => {
    it("404 when goal doesn't exist", async () => {
        const cookie = await getTestSessionCookie();
        const res = await request(app)
            .post('/api/goals/10')
            .set('Cookie', cookie)
            .send({});
        expect(res.status).toBe(404);
    });

    requiresGameModerator((cookie) => {
        let req = request(app).post('/api/goals/1');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req.send({});
    });

    it('400 without changes', async () => {
        const res = await request(app)
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({});
        expect(res.status).toBe(400);
    });

    it('Only edits provided fields', async () => {
        const req = request(app);
        let res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ goal: 'Updated goal text' });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            goal: 'Updated goal text',
        });
        expect(res.status).toBe(200);

        res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ description: 'Updated description' });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            description: 'Updated description',
        });
        expect(res.status).toBe(200);

        res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ difficulty: 7 });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            difficulty: 7,
        });
        expect(res.status).toBe(200);

        res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ categories: ['cat 1'] });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            categories: {
                set: [],
                connectOrCreate: [
                    {
                        create: {
                            name: 'cat 1',
                            game: { connect: { id: '1' } },
                        },
                        where: {
                            gameId_name: {
                                gameId: '1',
                                name: 'cat 1',
                            },
                        },
                    },
                ],
            },
        });
        expect(res.status).toBe(200);
    });
});
