import { ApiToken, Game } from '@prisma/client';
import { mock } from 'jest-mock-extended';
import { cleanupInterval } from '../core/RoomServer';
import { prisma } from '../database/Database';
import { closeSessionDatabase } from '../util/Session';

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

const mockGame = mock<Game>();
mockGame.id = '1';

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
