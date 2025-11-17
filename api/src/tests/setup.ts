import { mock } from 'jest-mock-extended';
import { ApiToken } from '@prisma/client';
import { prisma } from '../database/Database';
import { cleanupInterval } from '../core/RoomServer';
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
