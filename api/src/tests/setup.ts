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

export const mockCreateRoomAction = jest
    .spyOn(prisma.roomAction, 'create')
    .mockResolvedValue({
        id: 'test',
        action: 'JOIN',
        timestamp: new Date(),
        payload: 'test',
        roomId: 'test',
    });
export const mockPlayerUpsert = jest
    .spyOn(prisma.player, 'upsert')
    .mockResolvedValue({
        id: 'test',
        key: 'test',
        nickname: 'test',
        color: 'test',
        roomId: 'test',
        userId: null,
        teamId: null,
        finishedAt: null,
        spectator: false,
        monitor: false,
    });

jest.spyOn(prisma.team, 'upsert').mockResolvedValue({
    id: 'test',
    key: 'test',
    name: 'test',
    color: 'blue',
    roomId: 'test',
});
