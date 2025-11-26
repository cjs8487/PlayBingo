import { mock } from 'jest-mock-extended';
import { ApiToken, Game, Goal } from '@prisma/client';
import { prisma } from '../database/Database';
import { cleanupInterval } from '../core/RoomServer';
import { closeSessionDatabase } from '../util/Session';
import { gameForGoal } from '../database/games/Goals';

beforeEach(() => {
    // mockReset(prismaMock);
});

afterAll(() => {
    clearInterval(cleanupInterval);
    closeSessionDatabase();
});

const revokedTokenPayload = mock<ApiToken>();
revokedTokenPayload.revokedOn = new Date();

const mockValidTokenPayload = mock<ApiToken>();
mockValidTokenPayload.active = true;

export const mockFindToken = jest
    .spyOn(prisma.apiToken, 'findUnique')
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(revokedTokenPayload)
    .mockResolvedValue(mockValidTokenPayload);

jest.mock('../database/games/Goals', () => ({
    gameForGoal: jest.fn(() => mock<Game>()),
}));

jest.mock('../database/games/Games', () => ({
    isModerator: jest.fn(() => false),
    isOwner: jest.fn(() => false),
}));
