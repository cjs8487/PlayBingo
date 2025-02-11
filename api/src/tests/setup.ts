import { mock } from 'jest-mock-extended';
import { ApiToken } from '@prisma/client';
import { prisma } from '../database/Database';

beforeEach(() => {
    // mockReset(prismaMock);
});

const revokedTokenPayload = mock<ApiToken>();
revokedTokenPayload.revokedOn = new Date();

const mockValidTokenPayload = mock<ApiToken>();
mockValidTokenPayload.active = true;

export const mockFindToken = jest
    .spyOn(prisma.apiToken, 'findUnique')
    .mockResolvedValueOnce(revokedTokenPayload)
    .mockResolvedValue(mockValidTokenPayload);
