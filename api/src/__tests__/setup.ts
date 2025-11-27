import { Game, PrismaClient, User } from '@prisma/client';
import { DeepMockProxy, mock, mockDeep, mockReset } from 'jest-mock-extended';
import { cleanupInterval } from '../core/RoomServer';
import { prisma } from '../database/Database';
import { closeSessionDatabase } from '../util/Session';

afterAll(() => {
    clearInterval(cleanupInterval);
    closeSessionDatabase();
});

const mockGame = mock<Game>();
mockGame.id = '1';

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

jest.mock('../database/Users', () => {
    const original = jest.requireActual('../database/Users');
    return {
        ...original,
        registerUser: jest.fn().mockReturnValue(mock<User>()),
    };
});

jest.mock('../database/games/Goals', () => {
    const original = jest.requireActual('../database/games/Goals');
    return {
        ...original,
        editGoal: jest.fn().mockReturnValue(true),
        gameForGoal: jest
            .fn()
            .mockReturnValueOnce(null)
            .mockReturnValue(mockGame),
    };
});

jest.mock('../database/games/Games', () => ({
    isModerator: jest.fn().mockReturnValueOnce(false).mockReturnValue(true),
    isOwner: jest.fn().mockReturnValueOnce(false).mockReturnValue(true),
}));

jest.mock('../database/auth/ApiTokens');
