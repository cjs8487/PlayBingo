import { Connection, ConnectionService } from '@prisma/client';
import { mock } from 'jest-mock-extended';

export const mockConnection = mock<Connection>();
mockConnection.serviceId = 'rt-user-1';

export const getConnectionForUser = jest.fn(
    async (userId: string, service: ConnectionService) => ({
        ...mockConnection,
        userId,
        service,
    }),
);
export const deleteConnection = jest.fn(
    async (userId: string, service: ConnectionService) => ({
        ...mockConnection,
        userId,
        service,
    }),
);
export const createRacetimeConnection = jest.fn(
    async (userId: string, racetimeId: string, refreshToken: string) => ({
        ...mockConnection,
        userId,
        serviceId: racetimeId,
        refreshToken,
    }),
);
export const updateRefreshToken = jest.fn(
    async (user: string, service: ConnectionService, newToken: string) => ({
        ...mockConnection,
        userId: user,
        service,
        refreshToken: newToken,
    }),
);
