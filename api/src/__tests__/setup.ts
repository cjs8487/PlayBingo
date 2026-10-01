import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { cleanupInterval } from '../core/RoomServer';
import { prisma } from '../database/Database';
import { closeSessionDatabase } from '../util/Session';

afterAll(() => {
    clearInterval(cleanupInterval);
    closeSessionDatabase();
});

jest.mock('../database/Database', () => {
    const original = jest.requireActual('../database/Database');
    return {
        __esModule: true,
        ...original,
        prisma: mockDeep<PrismaClient>(),
    };
});

export const prismaMock = prisma as DeepMockProxy<PrismaClient>;

beforeEach(() => {
    mockReset(prismaMock);
});

afterEach(() => {
    jest.restoreAllMocks();
});

jest.mock('../database/Users')
    .mock('../database/Connections')
    .mock('../database/Rooms')
    .mock('../database/auth/ApiTokens')
    .mock('../database/games/Games')
    .mock('../database/games/Goals')
    .mock('../database/games/GoalCategories')
    .mock('../database/games/Variants');
