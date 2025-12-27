import { mock } from 'jest-mock-extended';
import { ApiToken } from '@prisma/client';
import { prisma } from '../database/Database';
import Room from '../core/Room';

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
        spectator: false,
        monitor: false,
    });
