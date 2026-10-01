import { makeGeneratorSchema } from '@playbingo/shared';
import { BingoMode } from '@prisma/client';
import request from 'supertest';
import { verifyRoomToken } from '../../../auth/RoomAuth';
import Room from '../../../core/Room';
import { allRooms } from '../../../core/RoomServer';
import { GenerationFailedError } from '../../../core/generation/GenerationFailedError';
import {
    createRoom,
    getFullRoomList,
    getRoomFromSlug,
} from '../../../database/Rooms';
import {
    gameForSlug,
    getDifficultyVariant,
    getTags,
    goalCount,
} from '../../../database/games/Games';
import { getCategories } from '../../../database/games/GoalCategories';
import {
    getGoalList,
    goalsForGame,
    goalsForGameFull,
} from '../../../database/games/Goals';
import { getVariant } from '../../../database/games/Variants';
import { app } from '../../../main';
import { handleAction } from '../../../routes/rooms/actions/Actions';
import {
    getTestSessionCookie,
    requiresLogin,
    requiresStaff,
} from '../../shared';

jest.mock('@playbingo/shared', () => {
    const original = jest.requireActual('@playbingo/shared');
    return {
        ...original,
        makeGeneratorSchema: jest.fn((...args: any[]) =>
            original.makeGeneratorSchema(...args),
        ),
    };
});

jest.mock('../../../auth/RoomAuth', () => {
    const original = jest.requireActual('../../../auth/RoomAuth');
    return {
        ...original,
        createRoomToken: jest.fn().mockReturnValue('mock-token'),
        verifyRoomToken: jest.fn(),
    };
});

jest.mock('../../../routes/rooms/actions/Actions', () => {
    const original = jest.requireActual(
        '../../../routes/rooms/actions/Actions',
    );
    return {
        ...original,
        handleAction: jest.fn(),
    };
});

let playerCookie = '';
const mockGoals = Array(30)
    .fill(0)
    .map((_, i) => ({
        id: `g-${i}`,
        goal: `Goal ${i}`,
        description: `Desc ${i}`,
        difficulty: 1,
        categories: [],
    }));

beforeAll(async () => {
    playerCookie = await getTestSessionCookie('player');
});

beforeEach(() => {
    jest.clearAllMocks();
    allRooms.clear();
    (goalCount as jest.Mock).mockResolvedValue(50);
    (getTags as jest.Mock).mockResolvedValue([]);
    (goalsForGame as jest.Mock).mockResolvedValue(mockGoals);
    (goalsForGameFull as jest.Mock).mockResolvedValue(mockGoals);
    (getCategories as jest.Mock).mockResolvedValue([]);
});

describe('GET /api/rooms', () => {
    it('200 with active rooms when inactive is not set', async () => {
        const mockRoom = {
            name: 'Active Room',
            game: 'Ocarina of Time',
        } as unknown as Room;
        allRooms.set('active-slug', mockRoom);

        const res = await request(app).get('/api/rooms');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            {
                name: 'Active Room',
                game: 'Ocarina of Time',
                slug: 'active-slug',
            },
        ]);
    });

    it('200 with all rooms when inactive is set', async () => {
        (getFullRoomList as jest.Mock).mockResolvedValueOnce([
            {
                name: 'DB Room',
                game: { name: 'Mario 64' },
                slug: 'db-slug',
            },
            {
                name: 'Deleted Game Room',
                game: null,
                slug: 'deleted-game-slug',
            },
        ]);

        const res = await request(app).get('/api/rooms?inactive=true');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { name: 'DB Room', game: 'Mario 64', slug: 'db-slug' },
            {
                name: 'Deleted Game Room',
                game: 'Deleted Game',
                slug: 'deleted-game-slug',
            },
        ]);
    });
});

describe('POST /api/rooms', () => {
    it('400 when name, game, or nickname is missing', async () => {
        let res = await request(app)
            .post('/api/rooms')
            .send({ game: 'oot', nickname: 'player' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing required element(s).');

        res = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room', nickname: 'player' });
        expect(res.status).toBe(400);

        res = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room', game: 'oot' });
        expect(res.status).toBe(400);
    });

    it('404 when game is not found', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room', game: 'unknown', nickname: 'player' });
        expect(res.status).toBe(404);
    });

    it('400 when game has less than 25 goals', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'small-game',
            name: 'Small Game',
            slugWords: [],
        });
        (goalCount as jest.Mock).mockResolvedValueOnce(20);

        const res = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room', game: 'small-game', nickname: 'player' });
        expect(res.status).toBe(400);
        expect(res.text).toContain(
            'Game has less than the minimum amount of goals required',
        );
    });

    it('200 and creates standard room with SRLv5 mode when enableSRLv5 is true', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: ['sword', 'shield'],
            enableSRLv5: true,
            newGeneratorBeta: false,
            racetimeBeta: false,
        });

        const res = await request(app).post('/api/rooms').send({
            name: 'SRL Room',
            game: 'oot',
            nickname: 'player',
            mode: 'lockout',
        });
        expect(res.status).toBe(200);
        expect(res.body.slug).toBeDefined();
        expect(res.body.authToken).toBe('mock-token');
        expect(createRoom).toHaveBeenCalled();
    });

    it('200 and creates room with random generation when enableSRLv5 is false', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: [],
            enableSRLv5: false,
            newGeneratorBeta: false,
            racetimeBeta: false,
        });

        const res = await request(app)
            .post('/api/rooms')
            .send({ name: 'Random Room', game: 'oot', nickname: 'player' });
        expect(res.status).toBe(200);
    });

    it('200 and handles exploration mode options', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: [],
            enableSRLv5: false,
            newGeneratorBeta: false,
        });

        const res = await request(app).post('/api/rooms').send({
            name: 'Exploration Room',
            game: 'oot',
            nickname: 'player',
            exploration: true,
            explorationStart: 'RANDOM',
            explorationStartCount: 3,
        });
        expect(res.status).toBe(200);
    });

    it('400 when variant does not belong to game (non-beta game)', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: [],
            newGeneratorBeta: false,
        });
        (getDifficultyVariant as jest.Mock).mockResolvedValueOnce({
            id: 'v1',
            gameId: 'other-game',
        });

        const res = await request(app).post('/api/rooms').send({
            name: 'Variant Room',
            game: 'oot',
            nickname: 'player',
            variant: 'v1',
        });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid variant selected.');
    });

    it('200 and creates room with difficulty variant (non-beta game)', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: [],
            newGeneratorBeta: false,
        });
        (getDifficultyVariant as jest.Mock).mockResolvedValueOnce({
            id: 'v1',
            gameId: 'g1',
            name: 'Hard',
            goalAmounts: [25],
        });

        const res = await request(app).post('/api/rooms').send({
            name: 'Variant Room',
            game: 'oot',
            nickname: 'player',
            variant: 'v1',
        });
        expect(res.status).toBe(200);
    });

    it('400 when variant is invalid for beta generator game', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: [],
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
        });
        (getDifficultyVariant as jest.Mock).mockResolvedValueOnce(null);
        (getVariant as jest.Mock).mockResolvedValueOnce({
            id: 'v2',
            gameId: 'other-game',
        });

        const res = await request(app).post('/api/rooms').send({
            name: 'Beta Room',
            game: 'oot',
            nickname: 'player',
            variant: 'v2',
        });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid variant selected.');
    });

    it('200 and creates room with beta generator and valid difficulty variant', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: [],
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
        });
        (getDifficultyVariant as jest.Mock).mockResolvedValueOnce({
            id: 'dv1',
            gameId: 'g1',
            name: 'Beta Diff Var',
            goalAmounts: [25],
        });

        const res = await request(app).post('/api/rooms').send({
            name: 'Beta Diff Room',
            game: 'oot',
            nickname: 'player',
            variant: 'dv1',
        });
        expect(res.status).toBe(200);
    });

    it('500 when generator config in db is invalid for beta game', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: [],
            newGeneratorBeta: true,
            generatorSettings: { invalid: true },
        });
        (makeGeneratorSchema as jest.Mock).mockReturnValueOnce({
            schema: {
                safeParse: () => ({ success: false }),
            },
        });

        const res = await request(app).post('/api/rooms').send({
            name: 'Beta Invalid Room',
            game: 'oot',
            nickname: 'player',
        });
        expect(res.status).toBe(500);
        expect(res.text).toBe('Invalid generator configuration.');
    });

    it('200 and creates room with beta generator and valid variant', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: [],
            newGeneratorBeta: true,
            generatorSettings: { generator: 'random' },
        });
        (getDifficultyVariant as jest.Mock).mockResolvedValueOnce(null);
        (getVariant as jest.Mock).mockResolvedValueOnce({
            id: 'v1',
            gameId: 'g1',
            name: 'Short Variant',
            generatorSettings: { generator: 'random' },
        });
        (makeGeneratorSchema as jest.Mock).mockReturnValueOnce({
            schema: {
                safeParse: () => ({
                    success: true,
                    data: {
                        generator: 'random',
                        difficulty: 'none',
                        boardLayout: { mode: '5x5' },
                        goals: { mode: 'all' },
                    },
                }),
            },
        });
        const genSpy = jest
            .spyOn(Room.prototype, 'generateBoard')
            .mockResolvedValueOnce(undefined as any);

        const res = await request(app).post('/api/rooms').send({
            name: 'Beta Variant Room',
            game: 'oot',
            nickname: 'player',
            variant: 'v1',
        });
        expect(res.status).toBe(200);
        expect(genSpy).toHaveBeenCalled();
    });

    it('422 when BoardGenerator throws GenerationFailedError', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: [],
            enableSRLv5: false,
            newGeneratorBeta: false,
        });
        jest.spyOn(Room.prototype, 'generateBoard').mockRejectedValueOnce(
            new GenerationFailedError('Could not fill board', {} as any),
        );

        const res = await request(app)
            .post('/api/rooms')
            .send({ name: 'Fail Room', game: 'oot', nickname: 'player' });
        expect(res.status).toBe(422);
        expect(res.text).toContain('Could not fill board');
    });

    it('500 when BoardGenerator throws unknown error', async () => {
        (gameForSlug as jest.Mock).mockResolvedValueOnce({
            id: 'g1',
            slug: 'oot',
            name: 'Ocarina of Time',
            slugWords: [],
            enableSRLv5: false,
            newGeneratorBeta: false,
        });
        jest.spyOn(Room.prototype, 'generateBoard').mockRejectedValueOnce(
            new Error('Database disconnect during generation'),
        );

        const res = await request(app)
            .post('/api/rooms')
            .send({ name: 'Fail Room', game: 'oot', nickname: 'player' });
        expect(res.status).toBe(500);
        expect(res.text).toContain('An unknown generation error occurred');
    });
});

describe('GET /api/rooms/:slug', () => {
    it('404 when room is not in memory and not in database', async () => {
        (getRoomFromSlug as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app).get('/api/rooms/unknown-room');
        expect(res.status).toBe(404);
    });

    it('200 and loads room from memory if present with auto authenticate token', async () => {
        const mockRoom = new Room(
            'Memory Room',
            'Ocarina of Time',
            'oot',
            'mem-slug',
            '',
            'r1',
            false,
            BingoMode.LINES,
            1,
            false,
            'Normal',
            123,
        );
        jest.spyOn(mockRoom, 'canAutoAuthenticate').mockResolvedValueOnce({
            isMonitor: true,
            isSpectating: false,
        } as any);
        allRooms.set('mem-slug', mockRoom);

        const res = await request(app).get('/api/rooms/mem-slug');
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Memory Room');
        expect(res.body.slug).toBe('mem-slug');
        expect(res.body.token).toBe('mock-token');
    });

    it('200 and loads room from database with difficulty variant and fallback generator settings', async () => {
        (getGoalList as jest.Mock).mockResolvedValueOnce(
            Array(25)
                .fill(0)
                .map((_, i) => ({ id: `${i}`, goal: `Goal ${i}` })),
        );
        (getVariant as jest.Mock).mockResolvedValueOnce(null);
        (getDifficultyVariant as jest.Mock).mockResolvedValueOnce({
            id: 'diff-var-1',
            name: 'Diff Variant',
        });
        (getRoomFromSlug as jest.Mock).mockResolvedValueOnce({
            id: 'db-diff',
            slug: 'diff-slug',
            name: 'Diff Room',
            variantId: 'diff-var-1',
            game: {
                name: 'Zelda',
                slug: 'zelda',
                newGeneratorBeta: true,
                generatorSettings: {
                    boardLayout: { mode: '5x5' },
                    difficulty: 'none',
                    generator: 'random',
                    goals: { mode: 'all' },
                },
            },
            board: Array(25)
                .fill(0)
                .map((_, i) => `${i}`),
            players: [],
            history: [],
        });

        const res = await request(app).get('/api/rooms/diff-slug');
        expect(res.status).toBe(200);
        expect(res.body.variant).toBe('Diff Variant');
    });

    it('200 and loads room from database with unknown variant when variant not found', async () => {
        (getGoalList as jest.Mock).mockResolvedValueOnce(
            Array(25)
                .fill(0)
                .map((_, i) => ({ id: `${i}`, goal: `Goal ${i}` })),
        );
        (getVariant as jest.Mock).mockResolvedValueOnce(null);
        (getDifficultyVariant as jest.Mock).mockResolvedValueOnce(null);
        (getRoomFromSlug as jest.Mock).mockResolvedValueOnce({
            id: 'db-unknown-var',
            slug: 'un-slug',
            name: 'Unknown Var Room',
            variantId: 'missing-var-id',
            game: {
                name: 'Zelda',
                slug: 'zelda',
                newGeneratorBeta: false,
            },
            board: Array(25)
                .fill(0)
                .map((_, i) => `${i}`),
            players: [],
            history: [],
        });

        const res = await request(app).get('/api/rooms/un-slug');
        expect(res.status).toBe(200);
        expect(res.body.variant).toBe('Unknown Variant');
    });

    it('200 and loads room from database with replay history (JOIN, LEAVE, MARK, UNMARK, CHAT, CHANGECOLOR)', async () => {
        (getGoalList as jest.Mock).mockResolvedValueOnce(
            Array(25)
                .fill(0)
                .map((_, i) => ({ id: `${i}`, goal: `Goal ${i}` })),
        );
        (getRoomFromSlug as jest.Mock).mockResolvedValueOnce({
            id: 'db-r1',
            slug: 'loaded-slug',
            name: 'Loaded Room',
            password: null,
            hideCard: false,
            bingoMode: 'lockout',
            lineCount: 1,
            seed: 456,
            variantId: null,
            explorationStart: null,
            racetimeRoom: null,
            game: {
                name: 'Ocarina of Time',
                slug: 'oot',
                newGeneratorBeta: false,
                racetimeBeta: false,
            },
            board: Array(25)
                .fill(0)
                .map((_, i) => `${i}`),
            players: [
                {
                    key: 'p1-key',
                    nickname: 'Alice',
                    color: 'red',
                    spectator: false,
                    monitor: false,
                    userId: 'u1',
                },
                {
                    key: 'p2-key',
                    nickname: 'Bob',
                    color: 'blue',
                    spectator: false,
                    monitor: false,
                    userId: 'u2',
                },
            ],
            history: [
                {
                    action: 'JOIN',
                    payload: { nickname: 'Alice', color: 'red' },
                },
                {
                    action: 'LEAVE',
                    payload: { nickname: 'Alice', color: 'red' },
                },
                {
                    action: 'MARK',
                    payload: {
                        nickname: 'Alice',
                        player: 'p1-key',
                        row: 0,
                        col: 0,
                    },
                },
                {
                    action: 'MARK',
                    payload: {
                        nickname: 'Bob',
                        player: 'p2-key',
                        row: 0,
                        col: 0,
                    },
                },
                {
                    action: 'UNMARK',
                    payload: {
                        nickname: 'Alice',
                        player: 'p1-key',
                        row: 0,
                        col: 0,
                    },
                },
                {
                    action: 'CHAT',
                    payload: { nickname: 'Alice', message: 'Hello' },
                },
                {
                    action: 'CHANGECOLOR',
                    payload: {
                        nickname: 'Alice',
                        oldColor: 'red',
                        newColor: 'blue',
                    },
                },
            ],
        });

        const res = await request(app).get('/api/rooms/loaded-slug');
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Loaded Room');
        expect(res.body.slug).toBe('loaded-slug');
        expect(allRooms.has('loaded-slug')).toBe(true);
    });

    it('200 and loads room with custom board layout from database', async () => {
        (getGoalList as jest.Mock).mockResolvedValueOnce(
            Array(9)
                .fill(0)
                .map((_, i) => ({ id: `${i}`, goal: `Goal ${i}` })),
        );
        (getVariant as jest.Mock).mockResolvedValueOnce({
            id: 'var-1',
            name: '3x3 Variant',
            generatorSettings: {
                boardLayout: {
                    mode: 'custom',
                    layout: [
                        [true, true, true],
                        [true, true, true],
                        [true, true, true],
                    ],
                },
                difficulty: 'none',
                generator: 'random',
                goals: { mode: 'all' },
            },
        });
        (getRoomFromSlug as jest.Mock).mockResolvedValueOnce({
            id: 'custom-r1',
            slug: 'custom-slug',
            name: 'Custom Room',
            variantId: 'var-1',
            board: Array(9)
                .fill(0)
                .map((_, i) => `${i}`),
            game: {
                name: 'Zelda',
                slug: 'zelda',
                newGeneratorBeta: true,
            },
            players: [],
            history: [],
        });

        const res = await request(app).get('/api/rooms/custom-slug');
        expect(res.status).toBe(200);
        expect(res.body.variant).toBe('3x3 Variant');
    });
});

describe('POST /api/rooms/:slug/authorize', () => {
    it('404 when room not found', async () => {
        const res = await request(app)
            .post('/api/rooms/unknown-room/authorize')
            .send({ password: 'pw' });
        expect(res.status).toBe(404);
    });

    it('403 when password does not match', async () => {
        const mockRoom = new Room(
            'Private Room',
            'Ocarina of Time',
            'oot',
            'priv-slug',
            'secret-password',
            'r1',
            false,
            BingoMode.LINES,
            1,
            false,
            'Normal',
            123,
        );
        allRooms.set('priv-slug', mockRoom);

        const res = await request(app)
            .post('/api/rooms/priv-slug/authorize')
            .send({ password: 'wrong-password' });
        expect(res.status).toBe(403);
    });

    it('200 and returns authToken when password matches', async () => {
        const mockRoom = new Room(
            'Private Room',
            'Ocarina of Time',
            'oot',
            'priv-slug',
            'secret-password',
            'r1',
            false,
            BingoMode.LINES,
            1,
            false,
            'Normal',
            123,
        );
        allRooms.set('priv-slug', mockRoom);

        const res = await request(app)
            .post('/api/rooms/priv-slug/authorize')
            .send({ password: 'secret-password', spectator: false });
        expect(res.status).toBe(200);
        expect(res.body.authToken).toBe('mock-token');
    });
});

describe('POST /api/rooms/:slug/actions', () => {
    requiresLogin(() =>
        request(app)
            .post('/api/rooms/test-room/actions')
            .send({ action: 'racetime/refresh' }),
    );

    it('400 when authToken is missing', async () => {
        const res = await request(app)
            .post('/api/rooms/test-room/actions')
            .set('Cookie', playerCookie)
            .send({ action: 'racetime/refresh' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing required body parameter');
    });

    it('404 when room is not found in allRooms', async () => {
        const res = await request(app)
            .post('/api/rooms/non-existent-room/actions')
            .set('Cookie', playerCookie)
            .send({ authToken: 'tok', action: 'racetime/refresh' });
        expect(res.status).toBe(404);
    });

    it('403 when verifyRoomToken fails (returns null)', async () => {
        const mockRoom = new Room(
            'Room',
            'Ocarina of Time',
            'oot',
            'room-slug',
            '',
            'r1',
            false,
            BingoMode.LINES,
            1,
            false,
            'Normal',
            123,
        );
        allRooms.set('room-slug', mockRoom);
        (verifyRoomToken as jest.Mock).mockReturnValueOnce(null);

        const res = await request(app)
            .post('/api/rooms/room-slug/actions')
            .set('Cookie', playerCookie)
            .send({
                authToken: 'invalid-token',
                action: 'racetime/refresh',
            });
        expect(res.status).toBe(403);
    });

    it('400 with the action error message', async () => {
        const mockRoom = new Room(
            'Room',
            'Ocarina of Time',
            'oot',
            'room-slug',
            '',
            'r1',
            false,
            BingoMode.LINES,
            1,
            false,
            'Normal',
            123,
        );
        allRooms.set('room-slug', mockRoom);
        (verifyRoomToken as jest.Mock).mockReturnValueOnce({
            isMonitor: false,
            isSpectating: false,
        });
        (handleAction as jest.Mock).mockResolvedValueOnce({
            code: 400,
            message: 'Invalid action parameters',
        });

        const res = await request(app)
            .post('/api/rooms/room-slug/actions')
            .set('Cookie', playerCookie)
            .send({ authToken: 'valid-token', action: 'bad/action' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid action parameters');
    });

    it('200 with the action JSON value', async () => {
        const mockRoom = new Room(
            'Room',
            'Ocarina of Time',
            'oot',
            'room-slug',
            '',
            'r1',
            false,
            BingoMode.LINES,
            1,
            false,
            'Normal',
            123,
        );
        allRooms.set('room-slug', mockRoom);
        (verifyRoomToken as jest.Mock).mockReturnValueOnce({
            isMonitor: true,
            isSpectating: false,
        });
        (handleAction as jest.Mock).mockResolvedValueOnce({
            code: 200,
            value: { url: 'https://racetime.gg/oot/test' },
        });

        const res = await request(app)
            .post('/api/rooms/room-slug/actions')
            .set('Cookie', playerCookie)
            .send({ authToken: 'valid-token', action: 'racetime/create' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ url: 'https://racetime.gg/oot/test' });
    });
});
