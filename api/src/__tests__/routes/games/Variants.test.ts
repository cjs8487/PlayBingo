import request from 'supertest';
import { app } from '../../../main';
import { getTags } from '../../../database/games/Games';
import { getCategories } from '../../../database/games/GoalCategories';
import {
    createVariant,
    deleteVariant,
    updateVariant,
} from '../../../database/games/Variants';
import { goalsForGameFull } from '../../../database/games/Goals';
import {
    getTestSessionCookie,
    requiresGameModerator,
    requiresLogin,
} from '../../shared';
import { Prisma } from '@prisma/client';
import { makeGeneratorSchema } from '@playbingo/shared';

jest.mock('@playbingo/shared', () => {
    const original = jest.requireActual('@playbingo/shared');
    return {
        ...original,
        makeGeneratorSchema: jest.fn((...args: any[]) =>
            original.makeGeneratorSchema(...args),
        ),
    };
});

let modCookie = '';
let playerCookie = '';

beforeAll(async () => {
    modCookie = await getTestSessionCookie('gameMod');
    playerCookie = await getTestSessionCookie('player');
});

beforeEach(() => {
    (getCategories as jest.Mock).mockResolvedValue([
        { id: 'cat-1', name: 'Cat 1', max: null, _count: { goals: 5 } },
    ]);
    (goalsForGameFull as jest.Mock).mockResolvedValue([
        {
            id: 'g-1',
            goal: 'Goal 1',
            difficulty: 1,
            categories: [{ id: 'cat-1' }],
        },
    ]);
    (getTags as jest.Mock).mockResolvedValue(['tag1']);
});

describe('POST /api/games/:slug/variants', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game/variants')
            .send({ name: 'Short', config: { generator: 'random' } }),
    );

    requiresGameModerator((cookie) => {
        let req = request(app).post('/api/games/test-game/variants');
        if (cookie) {
            req.set('Cookie', modCookie);
        }
        return req.send({ name: 'Short', config: { generator: 'random' } });
    });

    it('400 when name is missing', async () => {
        const res = await request(app)
            .post('/api/games/test-game/variants')
            .set('Cookie', modCookie)
            .send({ config: { generator: 'random' } });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Missing variant name');
    });

    it('400 when generator config is invalid', async () => {
        (makeGeneratorSchema as jest.Mock).mockReturnValueOnce({
            schema: {
                safeParse: () => ({
                    success: false,
                    error: { issues: [{ message: 'Bad config' }] },
                }),
            },
        });

        const res = await request(app)
            .post('/api/games/test-game/variants')
            .set('Cookie', modCookie)
            .send({ name: 'Variant', config: { invalid: true } });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid generation options');
    });

    it('201 when variant created successfully', async () => {
        const res = await request(app)
            .post('/api/games/test-game/variants')
            .set('Cookie', modCookie)
            .send({
                name: 'Standard Variant',
                description: 'A test variant',
                config: { generator: 'random' },
            });
        expect(res.status).toBe(201);
        expect(res.body).toEqual(
            expect.objectContaining({
                name: 'Standard Variant',
                description: 'A test variant',
            }),
        );
        expect(createVariant).toHaveBeenCalledWith(
            'test-game',
            'Standard Variant',
            expect.objectContaining({ boardLayout: { mode: 'random' } }),
            'A test variant',
        );
    });

    it('500 when createVariant throws error', async () => {
        (createVariant as jest.Mock).mockRejectedValueOnce(
            new Error('DB error'),
        );

        const res = await request(app)
            .post('/api/games/test-game/variants')
            .set('Cookie', modCookie)
            .send({
                name: 'Standard Variant',
                config: { generator: 'random' },
            });
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Internal server error' });
    });
});

describe('POST /api/games/:slug/variants/:id', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game/variants/var-1')
            .send({ name: 'Short', config: { generator: 'random' } }),
    );

    requiresGameModerator((cookie) => {
        let req = request(app).post('/api/games/test-game/variants');
        if (cookie) {
            req.set('Cookie', modCookie);
        }
        return req.send({ name: 'Short', config: { generator: 'random' } });
    });

    it('400 when name is missing', async () => {
        const res = await request(app)
            .post('/api/games/test-game/variants/var-1')
            .set('Cookie', modCookie)
            .send({ config: { generator: 'random' } });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Missing variant name');
    });

    it('400 when generator config is invalid', async () => {
        (makeGeneratorSchema as jest.Mock).mockReturnValueOnce({
            schema: {
                safeParse: () => ({
                    success: false,
                    error: { issues: [{ message: 'Bad config' }] },
                }),
            },
        });

        const res = await request(app)
            .post('/api/games/test-game/variants/var-1')
            .set('Cookie', modCookie)
            .send({ name: 'Variant', config: { invalid: true } });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Invalid generation options');
    });

    it('200 when variant updated successfully', async () => {
        const res = await request(app)
            .post('/api/games/test-game/variants/var-1')
            .set('Cookie', modCookie)
            .send({
                name: 'Updated Variant',
                description: 'Updated desc',
                config: { generator: 'random' },
            });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                id: 'var-1',
                name: 'Updated Variant',
                description: 'Updated desc',
            }),
        );
        expect(updateVariant).toHaveBeenCalledWith('var-1', {
            name: 'Updated Variant',
            description: 'Updated desc',
            generatorSettings: expect.objectContaining({
                boardLayout: { mode: 'random' },
            }),
        });
    });

    it('500 when updateVariant throws error', async () => {
        (updateVariant as jest.Mock).mockRejectedValueOnce(
            new Error('Update failed'),
        );

        const res = await request(app)
            .post('/api/games/test-game/variants/var-1')
            .set('Cookie', modCookie)
            .send({
                name: 'Updated Variant',
                config: { generator: 'random' },
            });
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Internal server error' });
    });
});

describe('DELETE /api/games/:slug/variants/:id', () => {
    requiresLogin(() =>
        request(app).delete('/api/games/test-game/variants/var-1'),
    );

    requiresGameModerator((cookie) => {
        let req = request(app).post('/api/games/test-game/variants');
        if (cookie) {
            req.set('Cookie', modCookie);
        }
        return req.send({ name: 'Short', config: { generator: 'random' } });
    });

    it('204 when variant is deleted successfully', async () => {
        const res = await request(app)
            .delete('/api/games/test-game/variants/var-1')
            .set('Cookie', modCookie);
        expect(res.status).toBe(204);
        expect(deleteVariant).toHaveBeenCalledWith('var-1');
    });

    it('404 when Prisma throws P2025 error (not found)', async () => {
        const pError = new Prisma.PrismaClientKnownRequestError(
            'Record not found',
            { code: 'P2025', clientVersion: '6.0.0' },
        );
        (deleteVariant as jest.Mock).mockRejectedValueOnce(pError);

        const res = await request(app)
            .delete('/api/games/test-game/variants/var-1')
            .set('Cookie', modCookie);
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Variant not found' });
    });

    it('500 when another error is thrown during delete', async () => {
        (deleteVariant as jest.Mock).mockRejectedValueOnce(
            new Error('Delete failure'),
        );

        const res = await request(app)
            .delete('/api/games/test-game/variants/var-1')
            .set('Cookie', modCookie);
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Internal server error' });
    });
});
