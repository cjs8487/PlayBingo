import request from 'supertest';
import {
    getTestSessionCookie,
    requiresGameModerator,
    requiresGameOwner,
} from '../../shared';
import { app } from '../../../main';
import { isModerator, isOwner } from '../../../database/games/Games';
import {
    createGoals,
    replaceAllGoalsForGame,
} from '../../../database/games/Goals';

let cookie = '';
beforeAll(async () => {
    cookie = await getTestSessionCookie('gameOwner');
});

describe('POST /api/goals/upload/srlv5', () => {
    const goalList = [
        { goal: 'Goal 1', difficulty: 4 },
        { goal: 'Goal 2' },
        { goal: 'Goal 3', categories: ['Category 1'] },
        { goal: 'Goal 3', difficulty: 8, categories: ['Category 1'] },
    ];
    it('400 if body is empty', async () => {
        const res = await request(app)
            .post('/api/goals/upload/srlv5')
            .set('Cookie', cookie)
            .send({});
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing game slug');
        expect(isOwner).not.toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('400 if slug is missing', async () => {
        const res = await request(app)
            .post('/api/goals/upload/srlv5')
            .set('Cookie', cookie)
            .send({ goals: [] });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing game slug');
        expect(isOwner).not.toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    requiresGameOwner((cookie) => {
        let req = request(app).post('/api/goals/upload/srlv5');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req.send({ slug: 'game' });
    });

    it('400 if goals is missing', async () => {
        const res = await request(app)
            .post('/api/goals/upload/srlv5')
            .set('Cookie', cookie)
            .send({ slug: 'game' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing goal list');
        expect(isOwner).toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('400 if goals is not an array', async () => {
        const res = await request(app)
            .post('/api/goals/upload/srlv5')
            .set('Cookie', cookie)
            .send({ slug: 'game', goals: 'abc' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid goal list format');
        expect(isOwner).toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('400 if goals is empty', async () => {
        const res = await request(app)
            .post('/api/goals/upload/srlv5')
            .set('Cookie', cookie)
            .send({ slug: 'game', goals: [] });
        expect(res.status).toBe(400);
        expect(isOwner).toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it("404 if the game doesn't exist", async () => {
        const res = await request(app)
            .post('/api/goals/upload/srlv5')
            .set('Cookie', cookie)
            .send({ slug: 'invalid', goals: goalList });
        expect(res.status).toBe(404);
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('Calls createGoals when inputs are valid', async () => {
        const res = await request(app)
            .post('/api/goals/upload/srlv5')
            .set('Cookie', cookie)
            .send({ slug: 'game', goals: goalList });
        expect(res.status).toBe(201);
        expect(createGoals).toHaveBeenCalledWith('game', goalList);
    });
});

describe('POST /api/goals/upload/list', () => {
    const goalList = [
        { goal: 'Goal 1', difficulty: 4 },
        { goal: 'Goal 2' },
        { goal: 'Goal 3', categories: ['Category 1'] },
        { goal: 'Goal 3', difficulty: 8, categories: ['Category 1'] },
        'Goal 4',
        { goal: 'Goal 5', description: 'Goal description' },
    ];
    it('400 if body is empty', async () => {
        const res = await request(app)
            .post('/api/goals/upload/list')
            .set('Cookie', cookie)
            .send({});
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing game slug');
        expect(isOwner).not.toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('400 if slug is missing', async () => {
        const res = await request(app)
            .post('/api/goals/upload/list')
            .set('Cookie', cookie)
            .send({ goals: [] });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing game slug');
        expect(isOwner).not.toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    requiresGameOwner((cookie) => {
        let req = request(app).post('/api/goals/upload/list');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req.send({ slug: 'game' });
    });

    it('400 if goals is missing', async () => {
        const res = await request(app)
            .post('/api/goals/upload/list')
            .set('Cookie', cookie)
            .send({ slug: 'game' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing goal list');
        expect(isOwner).toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('400 if goals is not an array', async () => {
        const res = await request(app)
            .post('/api/goals/upload/list')
            .set('Cookie', cookie)
            .send({ slug: 'game', goals: 'abc' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid goal list format');
        expect(isOwner).toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('400 if goals is empty', async () => {
        const res = await request(app)
            .post('/api/goals/upload/list')
            .set('Cookie', cookie)
            .send({ slug: 'game', goals: [] });
        expect(res.status).toBe(400);
        expect(isOwner).toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it("404 if the game doesn't exist", async () => {
        const res = await request(app)
            .post('/api/goals/upload/srlv5')
            .set('Cookie', cookie)
            .send({ slug: 'invalid', goals: goalList });
        expect(res.status).toBe(404);
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('Calls createGoals when inputs are valid', async () => {
        const res = await request(app)
            .post('/api/goals/upload/list')
            .set('Cookie', cookie)
            .send({ slug: 'game', goals: goalList });
        expect(res.status).toBe(201);
        expect(createGoals).toHaveBeenCalledWith('game', [
            goalList[0],
            goalList[1],
            goalList[2],
            goalList[3],
            { goal: goalList[4] },
            goalList[5],
        ]);
    });
});

describe('POST /api/goals/upload/replace', () => {
    const goalList = [
        { goal: 'Goal 1', difficulty: 4 },
        { goal: 'Goal 2' },
        { goal: 'Goal 3', categories: ['Category 1'] },
        { goal: 'Goal 3', difficulty: 8, categories: ['Category 1'] },
        { goal: 'Goal 4', description: 'Goal description' },
    ];

    it('400 if body is empty', async () => {
        const res = await request(app)
            .post('/api/goals/upload/replace')
            .set('Cookie', cookie)
            .send({});
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing game slug');
        expect(isOwner).not.toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('400 if slug is missing', async () => {
        const res = await request(app)
            .post('/api/goals/upload/replace')
            .set('Cookie', cookie)
            .send({ goals: [] });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing game slug');
        expect(isOwner).not.toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    requiresGameModerator((cookie) => {
        let req = request(app).post('/api/goals/upload/replace');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req.send({ slug: 'game' });
    });

    it('400 if goals is missing', async () => {
        const res = await request(app)
            .post('/api/goals/upload/replace')
            .set('Cookie', cookie)
            .send({ slug: 'game' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid goal list format');
        expect(isModerator).toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('400 if goals is not an array', async () => {
        const res = await request(app)
            .post('/api/goals/upload/replace')
            .set('Cookie', cookie)
            .send({ slug: 'game', goals: 'abc' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid goal list format');
        expect(isModerator).toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('400 if goals is empty', async () => {
        const res = await request(app)
            .post('/api/goals/upload/replace')
            .set('Cookie', cookie)
            .send({ slug: 'game', goals: [] });
        expect(res.status).toBe(400);
        expect(isModerator).toHaveBeenCalled();
        expect(createGoals).not.toHaveBeenCalled();
    });

    it("404 if the game doesn't exist", async () => {
        const res = await request(app)
            .post('/api/goals/upload/srlv5')
            .set('Cookie', cookie)
            .send({ slug: 'invalid', goals: goalList });
        expect(res.status).toBe(404);
        expect(createGoals).not.toHaveBeenCalled();
    });

    it('Calls createGoals when inputs are valid', async () => {
        const res = await request(app)
            .post('/api/goals/upload/replace')
            .set('Cookie', cookie)
            .send({ slug: 'game', goals: goalList });
        expect(res.status).toBe(200);
        expect(replaceAllGoalsForGame).toHaveBeenCalledWith('game', goalList);
    });
});
