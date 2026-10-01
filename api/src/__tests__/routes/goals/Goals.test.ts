import request from 'supertest';
import {
    deleteGoal,
    editGoal,
    gameForGoal,
} from '../../../database/games/Goals';
import { app } from '../../../main';
import { getTestSessionCookie, requiresGameModerator } from '../../shared';

let cookie = '';

beforeAll(async () => {
    cookie = await getTestSessionCookie('gameMod');
});

describe('GET /api/goals/:id', () => {
    it('405 because retrieving an individual goal is not supported', async () => {
        const res = await request(app).get('/api/goals/1');
        expect(res.status).toBe(405);
    });
});

describe('POST /api/goals/:id', () => {
    it("404 when goal doesn't exist", async () => {
        (gameForGoal as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app)
            .post('/api/goals/10')
            .set('Cookie', cookie)
            .send({});
        expect(res.status).toBe(404);
        expect(editGoal).not.toHaveBeenCalled();
    });

    requiresGameModerator((cookie) => {
        let req = request(app).post('/api/goals/1');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req.send();
    });

    it('400 without changes', async () => {
        const res = await request(app)
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({});
        expect(res.status).toBe(400);
    });

    it('400 when meta JSON syntax is invalid', async () => {
        const res = await request(app)
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ meta: 'invalid-json{' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid metadata - invalid JSON syntax');
    });

    it('400 when meta fails dangerous key check', async () => {
        const res = await request(app)
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ meta: JSON.stringify({ constructor: 123 }) });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('404 when editGoal returns false', async () => {
        (editGoal as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ goal: 'Will fail' });
        expect(res.status).toBe(404);
    });

    it('200 and edits only the provided fields', async () => {
        const req = request(app);
        let res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ goal: 'Updated goal text' });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            goal: 'Updated goal text',
            description: undefined,
            meta: undefined,
        });
        expect(res.status).toBe(200);

        res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ description: 'Updated description' });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            goal: undefined,
            description: 'Updated description',
            meta: undefined,
        });
        expect(res.status).toBe(200);

        res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ difficulty: 7 });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            goal: undefined,
            description: undefined,
            meta: undefined,
            difficulty: 7,
        });
        expect(res.status).toBe(200);

        res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ goal: 'Reset difficulty', difficulty: 0 });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            goal: 'Reset difficulty',
            description: undefined,
            meta: undefined,
            difficulty: null,
        });
        expect(res.status).toBe(200);

        res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ tags: ['tag-1', 'tag-2'] });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            goal: undefined,
            description: undefined,
            meta: undefined,
            tags: {
                set: [],
                connect: [{ id: 'tag-1' }, { id: 'tag-2' }],
            },
        });
        expect(res.status).toBe(200);

        res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ categories: ['cat 1'] });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            goal: undefined,
            description: undefined,
            meta: undefined,
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

        res = await req
            .post('/api/goals/1')
            .set('Cookie', cookie)
            .send({ meta: JSON.stringify({ note: 'valid' }) });
        expect(editGoal).toHaveBeenLastCalledWith('1', {
            goal: undefined,
            description: undefined,
            meta: { note: 'valid' },
        });
        expect(res.status).toBe(200);
    });
});

describe('DELETE /api/goals/:id', () => {
    it("404 when goal doesn't exist", async () => {
        (gameForGoal as jest.Mock).mockReturnValueOnce(null);
        const res = await request(app)
            .delete('/api/goals/10')
            .set('Cookie', cookie)
            .send();
        expect(res.status).toBe(404);
        expect(deleteGoal).not.toHaveBeenCalled();
    });

    requiresGameModerator((cookie) => {
        let req = request(app).delete('/api/goals/1');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req.send();
    });

    it('404 when deleteGoal returns false', async () => {
        (deleteGoal as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .delete('/api/goals/10')
            .set('Cookie', cookie)
            .send();
        expect(res.status).toBe(404);
    });

    it('200 for normal operation', async () => {
        const res = await request(app)
            .delete('/api/goals/10')
            .set('Cookie', cookie)
            .send();
        expect(res.status).toBe(200);
        expect(deleteGoal).toHaveBeenCalled();
    });
});
