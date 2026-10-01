import request from 'supertest';
import { app } from '../../../main';
import {
    addModerators,
    addOwners,
    allGames,
    createDifficultyVariant,
    createGame,
    deleteGame,
    favoriteGame,
    gameForSlug,
    getTags,
    removeModerator,
    removeOwner,
    tagBelongsToGame,
    unfavoriteGame,
    updateGameName,
    updateDifficultyVariant,
    updateLinks,
} from '../../../database/games/Games';
import {
    createCategory,
    getCategories,
} from '../../../database/games/GoalCategories';
import {
    createGoal,
    deleteAllGoalsForGame,
    goalsForGame,
    goalsForGameFull,
} from '../../../database/games/Goals';
import { getUsersEligibleToModerateGame } from '../../../database/Users';
import { getVariant } from '../../../database/games/Variants';
import { deleteFile, saveFile } from '../../../media/MediaServer';
import {
    getTestSessionCookie,
    requiresGameModerator,
    requiresGameOwner,
    requiresLogin,
} from '../../shared';
import { BoardGenerator } from '../../../core/generation/BoardGenerator';
import { GenerationFailedError } from '../../../core/generation/GenerationFailedError';
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

jest.mock('../../../media/MediaServer');

jest.mock('../../../core/generation/BoardGenerator', () => {
    return {
        BoardGenerator: jest.fn().mockImplementation(() => ({
            generateBoard: jest.fn(),
            board: [
                [
                    {
                        id: '1',
                        goal: 'G1',
                        description: 'D1',
                        categories: [],
                        difficulty: 1,
                    },
                ],
            ],
            seed: 12345,
        })),
    };
});

let playerCookie = '';
let modCookie = '';
let ownerCookie = '';

beforeAll(async () => {
    playerCookie = await getTestSessionCookie('player');
    modCookie = await getTestSessionCookie('gameMod');
    ownerCookie = await getTestSessionCookie('gameOwner');
});

beforeEach(() => {
    (getCategories as jest.Mock).mockResolvedValue([]);
    (goalsForGameFull as jest.Mock).mockResolvedValue([]);
    (getTags as jest.Mock).mockResolvedValue([]);
});

describe('GET /api/games', () => {
    it('200 and returns all games', async () => {
        const mockGames = [{ id: '1', name: 'Zelda', slug: 'oot' }];
        (allGames as jest.Mock).mockResolvedValueOnce(mockGames);

        const res = await request(app).get('/api/games');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockGames);
    });
});

describe('GET /api/games/:slug', () => {
    it('404 when game not found', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app).get('/api/games/unknown-slug');
        expect(res.status).toBe(404);
    });

    it('200 with formatted game when found', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: '1',
            slug: 'zelda',
            name: 'Zelda',
            coverImage: 'cover.png',
            owners: [
                {
                    id: 'u1',
                    username: 'owner1',
                    staff: false,
                    avatar: null,
                },
            ],
            moderators: [
                { id: 'u2', username: 'mod1', staff: false, avatar: null },
            ],
            enableSRLv5: true,
            racetimeBeta: false,
            racetimeCategory: null,
            racetimeGoal: null,
            difficultyVariantsEnabled: false,
            difficultyVariants: [],
            difficultyGroups: null,
            slugWords: ['word'],
            useTypedRandom: false,
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
            descriptionMd: 'Desc',
            setupMd: 'Setup',
            resources: [
                {
                    id: 'r1',
                    name: 'Res',
                    url: 'http://a.b',
                    description: 'd',
                },
            ],
            variants: [
                {
                    id: 'v1',
                    name: 'V1',
                    description: 'Desc',
                    generatorSettings: null,
                },
            ],
        });
        const res = await request(app).get('/api/games/zelda');
        expect(res.status).toBe(200);
        expect(res.body.slug).toBe('zelda');
        expect(res.body.owners[0].username).toBe('owner1');
        expect(res.body.moderators[0].username).toBe('mod1');
        expect(res.body.variants[0].name).toBe('V1');
    });
});

describe('POST /api/games', () => {
    requiresLogin(() =>
        request(app).post('/api/games').send({ name: 'G', slug: 'g' }),
    );

    it('400 when name or slug is missing', async () => {
        let res = await request(app)
            .post('/api/games')
            .set('Cookie', playerCookie)
            .send({ slug: 'game' });
        expect(res.status).toBe(400);

        res = await request(app)
            .post('/api/games')
            .set('Cookie', playerCookie)
            .send({ name: 'Game' });
        expect(res.status).toBe(400);
    });

    it('400 when coverImage fails to save', async () => {
        (saveFile as jest.Mock).mockReturnValueOnce(false);
        const res = await request(app)
            .post('/api/games')
            .set('Cookie', playerCookie)
            .send({ name: 'Game', slug: 'game', coverImage: 'bad.png' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid cover image');
    });

    it('500 when createGame returns null', async () => {
        (createGame as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app)
            .post('/api/games')
            .set('Cookie', playerCookie)
            .send({ name: 'Game', slug: 'game' });
        expect(res.status).toBe(500);
    });

    it('409 with the error returned by createGame', async () => {
        (createGame as jest.Mock).mockResolvedValueOnce({
            statusCode: 409,
            message: 'Slug exists',
        });
        const res = await request(app)
            .post('/api/games')
            .set('Cookie', playerCookie)
            .send({ name: 'Game', slug: 'game' });
        expect(res.status).toBe(409);
        expect(res.text).toBe('Slug exists');
    });

    it('200 when created successfully', async () => {
        const res = await request(app)
            .post('/api/games')
            .set('Cookie', playerCookie)
            .send({ name: 'New Game', slug: 'new-game' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({ name: 'New Game', slug: 'new-game' }),
        );
    });
});

describe('POST /api/games/:slug', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game')
            .send({ name: 'Updated Game' }),
    );

    requiresGameOwner((cookie) => {
        const req = request(app).post('/api/games/test-game');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ users: ['u1'] });
    });

    it('400 when no changes provided', async () => {
        const res = await request(app)
            .post('/api/games/test-game')
            .set('Cookie', ownerCookie)
            .send({});
        expect(res.status).toBe(400);
        expect(res.text).toBe('No changes provided');
    });

    it('400 when coverImage fails to save', async () => {
        (saveFile as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .post('/api/games/test-game')
            .set('Cookie', ownerCookie)
            .send({ coverImage: 'bad.png' });
        expect(res.status).toBe(400);
    });

    it('400 when slugWords format is incorrect or < 50', async () => {
        let res = await request(app)
            .post('/api/games/test-game')
            .set('Cookie', ownerCookie)
            .send({ slugWords: 'not-array' });
        expect(res.status).toBe(400);

        res = await request(app)
            .post('/api/games/test-game')
            .set('Cookie', ownerCookie)
            .send({ slugWords: ['short', 'list'] });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Not enough slug words provided');

        const fiftyBadWords = Array(50).fill('word123');
        res = await request(app)
            .post('/api/games/test-game')
            .set('Cookie', ownerCookie)
            .send({ slugWords: fiftyBadWords });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Slug words can only contain letters');
    });

    it('400 when links format is invalid', async () => {
        let res = await request(app)
            .post('/api/games/test-game')
            .set('Cookie', ownerCookie)
            .send({ links: 'not-array' });
        expect(res.status).toBe(400);

        res = await request(app)
            .post('/api/games/test-game')
            .set('Cookie', ownerCookie)
            .send({ links: [{ name: 'Bad', url: 'not-a-valid-url' }] });
        expect(res.status).toBe(400);
    });

    it('200 and updates all fields properly', async () => {
        const fiftyGoodWords = Array(50).fill('word');
        const res = await request(app)
            .post('/api/games/test-game')
            .set('Cookie', ownerCookie)
            .send({
                name: 'Updated Name',
                coverImage: 'new-cover.png',
                shouldDeleteCover: true,
                enableSRLv5: true,
                racetimeCategory: 'rt-cat',
                racetimeGoal: 'rt-goal',
                difficultyVariantsEnabled: true,
                difficultyGroups: [{ name: 'group' }],
                slugWords: fiftyGoodWords,
                useTypedRandom: true,
                descriptionMd: 'Desc',
                setupMd: 'Setup',
                links: [{ name: 'Wiki', url: 'https://wiki.gg' }],
            });
        expect(res.status).toBe(200);
        expect(updateGameName).toHaveBeenCalledWith(
            'test-game',
            'Updated Name',
        );
        expect(deleteFile).toHaveBeenCalledWith('game', 'cover.png');
        expect(updateLinks).toHaveBeenCalled();
    });
});

describe('GET /api/games/:slug/goals', () => {
    it('200 with goals for the game', async () => {
        const mockGoals = [{ id: '1', goal: 'Goal 1' }];
        (goalsForGame as jest.Mock).mockResolvedValueOnce(mockGoals);

        const res = await request(app).get('/api/games/test-game/goals');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockGoals);
    });

    it('200 with full category data when requested', async () => {
        const mockGoals = [{ id: '1', categories: [{ id: 'cat-1' }] }];
        (goalsForGameFull as jest.Mock).mockResolvedValueOnce(mockGoals);

        const res = await request(app).get(
            '/api/games/test-game/goals?includeFullCatData=true',
        );
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockGoals);
        expect(goalsForGameFull).toHaveBeenCalledWith('test-game');
    });
});

describe('POST /api/games/:slug/goals', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game/goals')
            .send({ goal: 'Goal 1' }),
    );

    requiresGameModerator((cookie) => {
        const req = request(app).post('/api/games/test-game/goals');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ goal: 'Goal 1' });
    });

    it('400 when missing goal text', async () => {
        const res = await request(app)
            .post('/api/games/test-game/goals')
            .set('Cookie', modCookie)
            .send({});
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing goal text');
    });

    it('400 when difficulty is invalid number', async () => {
        const res = await request(app)
            .post('/api/games/test-game/goals')
            .set('Cookie', modCookie)
            .send({ goal: 'Goal 1', difficulty: 'not-a-number' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid difficulty value');
    });

    it('200 and creates a goal', async () => {
        const res = await request(app)
            .post('/api/games/test-game/goals')
            .set('Cookie', modCookie)
            .send({
                goal: 'New Goal',
                description: 'Desc',
                difficulty: 2,
                categories: ['cat1'],
            });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                goal: 'New Goal',
                description: 'Desc',
                difficulty: 2,
            }),
        );
    });
});

describe('GET /api/games/:slug/eligibleMods', () => {
    it('200 returns eligible mods', async () => {
        (getUsersEligibleToModerateGame as jest.Mock).mockResolvedValueOnce([
            'userA',
            'userB',
        ]);
        const res = await request(app).get('/api/games/test-game/eligibleMods');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(['userA', 'userB']);
    });
});

describe('POST /api/games/:slug/owners', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game/owners')
            .send({ users: ['u1'] }),
    );

    requiresGameOwner((cookie) => {
        const req = request(app).post('/api/games/test-game/owners');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ users: ['u1'] });
    });

    it('400 when users is missing or not array', async () => {
        let res = await request(app)
            .post('/api/games/test-game/owners')
            .set('Cookie', ownerCookie)
            .send({});
        expect(res.status).toBe(400);

        res = await request(app)
            .post('/api/games/test-game/owners')
            .set('Cookie', ownerCookie)
            .send({ users: 'not-array' });
        expect(res.status).toBe(400);
    });

    it('400 when one of the users does not exist', async () => {
        const res = await request(app)
            .post('/api/games/test-game/owners')
            .set('Cookie', ownerCookie)
            .send({ users: ['non-existent'] });
        expect(res.status).toBe(400);
    });

    it('200 and adds owners', async () => {
        const res = await request(app)
            .post('/api/games/test-game/owners')
            .set('Cookie', ownerCookie)
            .send({ users: ['u1'] });
        expect(res.status).toBe(200);
        expect(addOwners).toHaveBeenCalledWith('test-game', ['u1']);
    });
});

describe('DELETE /api/games/:slug/owners', () => {
    requiresLogin(() =>
        request(app).delete('/api/games/test-game/owners').send({ user: 'u1' }),
    );

    requiresGameOwner((cookie) => {
        const req = request(app).delete('/api/games/test-game/owners');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ user: 'u1' });
    });

    it('400 when user is missing', async () => {
        const res = await request(app)
            .delete('/api/games/test-game/owners')
            .set('Cookie', ownerCookie)
            .send({});
        expect(res.status).toBe(400);
    });

    it('404 when user does not exist', async () => {
        const res = await request(app)
            .delete('/api/games/test-game/owners')
            .set('Cookie', ownerCookie)
            .send({ user: 'non-existent' });
        expect(res.status).toBe(404);
    });

    it('404 when game not found', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app)
            .delete('/api/games/test-game/owners')
            .set('Cookie', ownerCookie)
            .send({ user: 'u1' });
        expect(res.status).toBe(404);
    });

    it('400 when attempting to remove the last owner', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            owners: [{ id: 'o1' }],
        });
        const res = await request(app)
            .delete('/api/games/test-game/owners')
            .set('Cookie', ownerCookie)
            .send({ user: 'u1' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Cannot remove the last owner of a game.');
    });

    it('200 and removes the owner', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            owners: [{ id: 'o1' }, { id: 'o2' }],
        });
        const res = await request(app)
            .delete('/api/games/test-game/owners')
            .set('Cookie', ownerCookie)
            .send({ user: 'u1' });
        expect(res.status).toBe(200);
        expect(removeOwner).toHaveBeenCalledWith('test-game', 'u1');
    });
});

describe('POST /api/games/:slug/moderators', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game/moderators')
            .send({ users: ['u1'] }),
    );

    requiresGameOwner((cookie) => {
        const req = request(app).post('/api/games/test-game/moderators');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ users: ['u1'] });
    });

    it('400 when users missing or not array', async () => {
        let res = await request(app)
            .post('/api/games/test-game/moderators')
            .set('Cookie', ownerCookie)
            .send({});
        expect(res.status).toBe(400);

        res = await request(app)
            .post('/api/games/test-game/moderators')
            .set('Cookie', ownerCookie)
            .send({ users: 'single-user' });
        expect(res.status).toBe(400);
    });

    it('400 when a moderator user does not exist', async () => {
        const res = await request(app)
            .post('/api/games/test-game/moderators')
            .set('Cookie', ownerCookie)
            .send({ users: ['non-existent'] });
        expect(res.status).toBe(400);
    });

    it('200 and adds moderators', async () => {
        const res = await request(app)
            .post('/api/games/test-game/moderators')
            .set('Cookie', ownerCookie)
            .send({ users: ['u1'] });
        expect(res.status).toBe(200);
        expect(addModerators).toHaveBeenCalledWith('test-game', ['u1']);
    });
});

describe('DELETE /api/games/:slug/moderators', () => {
    requiresLogin(() =>
        request(app)
            .delete('/api/games/test-game/moderators')
            .send({ user: 'u1' }),
    );

    requiresGameOwner((cookie) => {
        const req = request(app).delete('/api/games/test-game/moderators');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ user: 'u1' });
    });

    it('400 when user is missing', async () => {
        const res = await request(app)
            .delete('/api/games/test-game/moderators')
            .set('Cookie', ownerCookie)
            .send({});
        expect(res.status).toBe(400);
    });

    it('404 when moderator user does not exist', async () => {
        const res = await request(app)
            .delete('/api/games/test-game/moderators')
            .set('Cookie', ownerCookie)
            .send({ user: 'non-existent' });
        expect(res.status).toBe(404);
    });

    it('200 and removes the moderator', async () => {
        const res = await request(app)
            .delete('/api/games/test-game/moderators')
            .set('Cookie', ownerCookie)
            .send({ user: 'u1' });
        expect(res.status).toBe(200);
        expect(removeModerator).toHaveBeenCalledWith('test-game', 'u1');
    });
});

describe('GET /api/games/:slug/permissions', () => {
    it('401 when not logged in', async () => {
        const res = await request(app).get('/api/games/test-game/permissions');
        expect(res.status).toBe(401);
    });

    it('200 with owner and moderator permissions when logged in', async () => {
        const res = await request(app)
            .get('/api/games/test-game/permissions')
            .set('Cookie', ownerCookie);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ isOwner: true, canModerate: true });
    });
});

describe('DELETE /api/games/:slug/deleteAllGoals', () => {
    requiresLogin(() =>
        request(app).delete('/api/games/test-game/deleteAllGoals'),
    );

    requiresGameModerator((cookie) => {
        const req = request(app).delete('/api/games/test-game/deleteAllGoals');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req;
    });

    it('500 when deleteAllGoalsForGame returns false', async () => {
        (deleteAllGoalsForGame as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .delete('/api/games/test-game/deleteAllGoals')
            .set('Cookie', modCookie);
        expect(res.status).toBe(500);
    });

    it('200 deletes all goals when moderator', async () => {
        const res = await request(app)
            .delete('/api/games/test-game/deleteAllGoals')
            .set('Cookie', modCookie);
        expect(res.status).toBe(200);
        expect(deleteAllGoalsForGame).toHaveBeenCalledWith('test-game');
    });
});

describe('POST /api/games/:slug/favorite', () => {
    requiresLogin(() => request(app).post('/api/games/test-game/favorite'));

    it('200 and favorites the game', async () => {
        const res = await request(app)
            .post('/api/games/test-game/favorite')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(200);
        expect(favoriteGame).toHaveBeenCalledWith('test-game', 'test-user');
    });
});

describe('DELETE /api/games/:slug/favorite', () => {
    requiresLogin(() => request(app).delete('/api/games/test-game/favorite'));

    it('200 and unfavorites the game', async () => {
        const res = await request(app)
            .delete('/api/games/test-game/favorite')
            .set('Cookie', playerCookie);
        expect(res.status).toBe(200);
        expect(unfavoriteGame).toHaveBeenCalledWith('test-game', 'test-user');
    });
});

describe('POST /api/games/:slug/difficultyVariants', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game/difficultyVariants')
            .send({ name: 'Hard' }),
    );

    requiresGameOwner((cookie) => {
        const req = request(app).post(
            '/api/games/test-game/difficultyVariants',
        );
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ users: ['u1'] });
    });

    it('200 creates difficulty variant when owner', async () => {
        const res = await request(app)
            .post('/api/games/test-game/difficultyVariants')
            .set('Cookie', ownerCookie)
            .send({ name: 'Hard', goalAmounts: [5] });
        expect(res.status).toBe(200);
        expect(createDifficultyVariant).toHaveBeenCalledWith(
            'test-game',
            'Hard',
            [5],
        );
    });
});

describe('POST /api/games/:slug/difficultyVariants/:id', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game/difficultyVariants/dv-1')
            .send({ name: 'Very Hard' }),
    );

    requiresGameOwner((cookie) => {
        const req = request(app).post(
            '/api/games/test-game/difficultyVariants/dv-1',
        );
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ users: ['u1'] });
    });

    it('200 updates difficulty variant when owner', async () => {
        const res = await request(app)
            .post('/api/games/test-game/difficultyVariants/dv-1')
            .set('Cookie', ownerCookie)
            .send({ name: 'Very Hard' });
        expect(res.status).toBe(200);
        expect(updateDifficultyVariant).toHaveBeenCalledWith(
            'dv-1',
            'Very Hard',
            undefined,
        );
    });
});

describe('DELETE /api/games/:slug/difficultyVariants/:id', () => {
    requiresLogin(() =>
        request(app).delete('/api/games/test-game/difficultyVariants/dv-1'),
    );

    requiresGameOwner((cookie) => {
        const req = request(app).delete(
            '/api/games/test-game/difficultyVariants/dv-1',
        );
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send();
    });

    it('200 deletes difficulty variant when owner', async () => {
        const res = await request(app)
            .delete('/api/games/test-game/difficultyVariants/dv-1')
            .set('Cookie', ownerCookie);
        expect(res.status).toBe(200);
    });
});

describe('DELETE /api/games/:slug', () => {
    requiresLogin(() => request(app).delete('/api/games/test-game'));

    requiresGameOwner((cookie) => {
        const req = request(app).delete('/api/games/test-game');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send();
    });

    it('200 deletes game when user is owner', async () => {
        const res = await request(app)
            .delete('/api/games/test-game')
            .set('Cookie', ownerCookie);
        expect(res.status).toBe(200);
        expect(deleteGame).toHaveBeenCalledWith('test-game');
    });
});

describe('GET /api/games/:slug/categories', () => {
    it('200 with sorted categories', async () => {
        (getCategories as jest.Mock).mockResolvedValueOnce([
            {
                id: 'c2',
                name: 'Z Cat',
                max: null,
                _count: { goals: 1 },
            },
            { id: 'c1', name: 'A Cat', max: 5, _count: { goals: 3 } },
        ]);

        const res = await request(app).get('/api/games/test-game/categories');
        expect(res.status).toBe(200);
        expect(res.body[0].name).toBe('A Cat');
        expect(res.body[1].name).toBe('Z Cat');
    });
});

describe('POST /api/games/:slug/categories', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game/categories')
            .send({ name: 'New' }),
    );

    requiresGameModerator((cookie) => {
        const req = request(app).post('/api/games/test-game/categories');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ name: 'New Name' });
    });

    it('400 when name is missing', async () => {
        const res = await request(app)
            .post('/api/games/test-game/categories')
            .set('Cookie', modCookie)
            .send({});
        expect(res.status).toBe(400);
    });

    it('400 when max is not a number', async () => {
        const res = await request(app)
            .post('/api/games/test-game/categories')
            .set('Cookie', modCookie)
            .send({ name: 'Cat', max: 'invalid' });
        expect(res.status).toBe(400);
    });

    it('200 and creates a category when moderator', async () => {
        const res = await request(app)
            .post('/api/games/test-game/categories')
            .set('Cookie', modCookie)
            .send({ name: 'New Cat', max: 3 });
        expect(res.status).toBe(200);
        expect(createCategory).toHaveBeenCalledWith('New Cat', 'test-game', 3);
    });
});

describe('POST /api/games/:slug/generation', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game/generation')
            .send({ generator: 'random' }),
    );

    requiresGameOwner((cookie) => {
        const req = request(app).post('/api/games/test-game/generation');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ generator: 'random' });
    });

    it('400 when generator config fails schema parse', async () => {
        (makeGeneratorSchema as jest.Mock).mockReturnValueOnce({
            schema: {
                safeParse: () => ({
                    success: false,
                    error: { issues: ['bad'] },
                }),
            },
        });
        const res = await request(app)
            .post('/api/games/test-game/generation')
            .set('Cookie', ownerCookie)
            .send({ invalid: true });
        expect(res.status).toBe(400);
    });

    it('200 updates generator settings when owner', async () => {
        (getCategories as jest.Mock).mockResolvedValueOnce([
            { id: 'cat-1', name: 'Category', max: 2, _count: { goals: 3 } },
        ]);
        const res = await request(app)
            .post('/api/games/test-game/generation')
            .set('Cookie', ownerCookie)
            .send({ generator: 'random' });
        expect(res.status).toBe(200);
    });
});

describe('GET /api/games/:slug/tags', () => {
    it('200 with sorted tags', async () => {
        (getTags as jest.Mock).mockResolvedValueOnce([
            { id: 't2', name: 'Z Tag', _count: { goals: 1 } },
            { id: 't1', name: 'A Tag', _count: { goals: 2 } },
        ]);

        const res = await request(app).get('/api/games/test-game/tags');
        expect(res.status).toBe(200);
        expect(res.body[0].name).toBe('A Tag');
    });
});

describe('POST /api/games/:slug/tags', () => {
    requiresLogin(() =>
        request(app).post('/api/games/test-game/tags').send({ name: 'Tag 1' }),
    );

    it('400 when name is missing', async () => {
        const res = await request(app)
            .post('/api/games/test-game/tags')
            .set('Cookie', modCookie)
            .send({ name: '   ' });
        expect(res.status).toBe(400);
    });

    requiresGameModerator((cookie) => {
        const req = request(app).post('/api/games/test-game/tags');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ name: 'Tag 1' });
    });

    it('200 and creates a tag when moderator', async () => {
        const res = await request(app)
            .post('/api/games/test-game/tags')
            .set('Cookie', modCookie)
            .send({ name: 'Tag 1' });
        expect(res.status).toBe(200);
    });
});

describe('POST /api/games/:slug/tags/:id', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/games/test-game/tags/t-1')
            .send({ name: 'Updated' }),
    );

    it('400 when tag name is missing', async () => {
        const res = await request(app)
            .post('/api/games/test-game/tags/t-1')
            .set('Cookie', modCookie)
            .send({ name: '  ' });
        expect(res.status).toBe(400);
    });

    requiresGameModerator((cookie) => {
        const req = request(app).post('/api/games/test-game/tags/t-1');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req.send({ name: 'Updated Tag' });
    });

    it('404 when tag does not belong to game', async () => {
        (tagBelongsToGame as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .post('/api/games/test-game/tags/t-1')
            .set('Cookie', modCookie)
            .send({ name: 'Updated Tag' });
        expect(res.status).toBe(404);
    });

    it('200 and updates the tag', async () => {
        const res = await request(app)
            .post('/api/games/test-game/tags/t-1')
            .set('Cookie', modCookie)
            .send({ name: 'Updated Tag' });
        expect(res.status).toBe(200);
    });
});

describe('DELETE /api/games/:slug/tags/:id', () => {
    requiresLogin(() => request(app).delete('/api/games/test-game/tags/t-1'));

    requiresGameModerator((cookie) => {
        const req = request(app).delete('/api/games/test-game/tags/t-1');
        if (cookie) {
            req.set('Cookie', cookie);
        }
        return req;
    });

    it('404 when tag does not belong to game', async () => {
        (tagBelongsToGame as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .delete('/api/games/test-game/tags/t-1')
            .set('Cookie', modCookie);
        expect(res.status).toBe(404);
    });

    it('200 and deletes the tag', async () => {
        const res = await request(app)
            .delete('/api/games/test-game/tags/t-1')
            .set('Cookie', modCookie);
        expect(res.status).toBe(200);
    });
});

describe('GET /api/games/:slug/sampleBoard', () => {
    it('404 when game does not exist', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app).get('/api/games/unknown/sampleBoard');
        expect(res.status).toBe(404);
    });

    it('400 when game does not use newGeneratorBeta', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: '1',
            name: 'Old Game',
            newGeneratorBeta: false,
        });
        const res = await request(app).get('/api/games/old-game/sampleBoard');
        expect(res.status).toBe(400);
    });

    it('404 when variant parameter is given but variant not found', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: '1',
            name: 'Beta Game',
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
        });
        (getVariant as jest.Mock).mockResolvedValueOnce(null);

        const res = await request(app).get(
            '/api/games/beta-game/sampleBoard?variant=v-none',
        );
        expect(res.status).toBe(404);
    });

    it('404 when variant does not belong to game', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: '1',
            name: 'Beta Game',
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
        });
        (getVariant as jest.Mock).mockResolvedValueOnce({
            id: 'v1',
            gameId: 'other-game-id',
            name: 'Other',
        });

        const res = await request(app).get(
            '/api/games/beta-game/sampleBoard?variant=v1',
        );
        expect(res.status).toBe(404);
    });

    it('400 when variant is not a single string', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: '1',
            name: 'Beta Game',
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
        });

        const res = await request(app).get(
            '/api/games/beta-game/sampleBoard?variant=v1&variant=v2',
        );
        expect(res.status).toBe(400);
        expect(getVariant).not.toHaveBeenCalled();
    });

    it('200 generates sample board when game uses newGeneratorBeta', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: '1',
            name: 'Beta Game',
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
        });

        const res = await request(app).get('/api/games/beta-game/sampleBoard');
        expect(res.status).toBe(200);
        expect(res.body.board).toBeDefined();
        expect(res.body.width).toBe(1);
        expect(res.body.height).toBe(1);
    });

    it('200 generates sample board with variant', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: '1',
            name: 'Beta Game',
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
        });
        (getVariant as jest.Mock).mockResolvedValueOnce({
            id: 'v1',
            gameId: '1',
            name: 'Short',
            generatorSettings: { generator: 'random' },
        });

        const res = await request(app).get(
            '/api/games/beta-game/sampleBoard?variant=v1',
        );
        expect(res.status).toBe(200);
        expect(res.body.variant).toBe('Short');
    });

    it('422 when GenerationFailedError is thrown', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: '1',
            name: 'Beta Game',
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
        });
        (BoardGenerator as unknown as jest.Mock).mockImplementationOnce(() => ({
            generateBoard: () => {
                throw new GenerationFailedError('Not enough goals', {} as any);
            },
        }));

        const res = await request(app).get('/api/games/beta-game/sampleBoard');
        expect(res.status).toBe(422);
        expect(res.text).toContain('Not enough goals');
    });

    it('500 when unknown error is thrown during generation', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: '1',
            name: 'Beta Game',
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
        });
        (BoardGenerator as unknown as jest.Mock).mockImplementationOnce(() => ({
            generateBoard: () => {
                throw new Error('Boom');
            },
        }));

        const res = await request(app).get('/api/games/beta-game/sampleBoard');
        expect(res.status).toBe(500);
        expect(res.text).toContain('An unknown generation error occurred');
    });
});
