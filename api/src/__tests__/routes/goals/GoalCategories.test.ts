import request from 'supertest';
import { app } from '../../../main';
import {
    deleteCategory,
    getCategory,
    updateCategory,
} from '../../../database/games/GoalCategories';
import {
    getTestSessionCookie,
    requiresGameModerator,
    requiresLogin,
} from '../../shared';

let modCookie = '';
let playerCookie = '';

beforeAll(async () => {
    modCookie = await getTestSessionCookie('gameMod');
    playerCookie = await getTestSessionCookie('player');
});

describe('POST /api/goals/categories/:id', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/goals/categories/cat-1')
            .send({ name: 'Cat 1' }),
    );

    it('404 when category does not exist', async () => {
        (getCategory as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app)
            .post('/api/goals/categories/missing-cat')
            .set('Cookie', modCookie)
            .send({ name: 'Updated Cat' });
        expect(res.status).toBe(404);
    });

    requiresGameModerator((cookie) => {
        let req = request(app).delete('/api/goals/categories/cat-1');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req;
    });

    it('400 when missing required fields (neither name nor max provided)', async () => {
        (getCategory as jest.Mock).mockResolvedValueOnce({
            id: 'cat-1',
            game: { slug: 'test-game' },
        });
        const res = await request(app)
            .post('/api/goals/categories/cat-1')
            .set('Cookie', modCookie)
            .send({});
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing required fields');
    });

    it('400 when name is empty', async () => {
        (getCategory as jest.Mock).mockResolvedValueOnce({
            id: 'cat-1',
            game: { slug: 'test-game' },
        });
        const res = await request(app)
            .post('/api/goals/categories/cat-1')
            .set('Cookie', modCookie)
            .send({ name: '   ' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid value for name');
        expect(updateCategory).not.toHaveBeenCalled();
    });

    it('400 when max is not a number', async () => {
        (getCategory as jest.Mock).mockResolvedValueOnce({
            id: 'cat-1',
            game: { slug: 'test-game' },
        });
        const res = await request(app)
            .post('/api/goals/categories/cat-1')
            .set('Cookie', modCookie)
            .send({ max: 'five' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid value for max');
        expect(updateCategory).not.toHaveBeenCalled();
    });

    it('200 and updates category with name only', async () => {
        (getCategory as jest.Mock).mockResolvedValueOnce({
            id: 'cat-1',
            game: { slug: 'test-game' },
        });
        const res = await request(app)
            .post('/api/goals/categories/cat-1')
            .set('Cookie', modCookie)
            .send({ name: 'New Name' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({ id: 'cat-1', name: 'New Name' }),
        );
        expect(updateCategory).toHaveBeenCalledWith('cat-1', {
            name: 'New Name',
            max: undefined,
        });
    });

    it('200 and updates category with max only', async () => {
        (getCategory as jest.Mock).mockResolvedValueOnce({
            id: 'cat-1',
            game: { slug: 'test-game' },
        });
        const res = await request(app)
            .post('/api/goals/categories/cat-1')
            .set('Cookie', modCookie)
            .send({ max: 5 });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({ id: 'cat-1', max: 5 }),
        );
        expect(updateCategory).toHaveBeenCalledWith('cat-1', {
            name: undefined,
            max: 5,
        });
    });
});

describe('DELETE /api/goals/categories/:id', () => {
    requiresLogin(() => request(app).delete('/api/goals/categories/cat-1'));

    requiresGameModerator((cookie) => {
        let req = request(app).delete('/api/goals/categories/cat-1');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req;
    });

    it('404 when category does not exist', async () => {
        (getCategory as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app)
            .delete('/api/goals/categories/missing-cat')
            .set('Cookie', modCookie);
        expect(res.status).toBe(404);
    });

    requiresGameModerator((cookie) => {
        let req = request(app).delete('/api/goals/categories/cat-1');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req;
    });

    it('200 and deletes category when user is moderator', async () => {
        (getCategory as jest.Mock).mockResolvedValueOnce({
            id: 'cat-1',
            game: { slug: 'test-game' },
        });
        const res = await request(app)
            .delete('/api/goals/categories/cat-1')
            .set('Cookie', modCookie);
        expect(res.status).toBe(200);
        expect(deleteCategory).toHaveBeenCalledWith('cat-1');
    });
});
