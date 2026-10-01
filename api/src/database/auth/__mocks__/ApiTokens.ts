import { ApiToken } from '@prisma/client';
import { mock } from 'jest-mock-extended';

export const mockApiToken = mock<ApiToken>();
mockApiToken.token = 'new-raw-token';
mockApiToken.active = true;

export const validateToken = jest.fn(async (token: string) => {
    if (
        !token ||
        token === 'invalid' ||
        token === 'revoked' ||
        token === 'invalid-token'
    ) {
        return false;
    }
    return true;
});

export const getAllTokens = jest.fn(async () => [mockApiToken]);
export const createApiToken = jest.fn(async (name: string) => ({
    ...mockApiToken,
    name,
}));
export const activateToken = jest.fn(async (id: string) => ({
    ...mockApiToken,
    id,
    active: true,
}));
export const deactivateToken = jest.fn(async (id: string) => ({
    ...mockApiToken,
    id,
    active: false,
}));
export const revokeToken = jest.fn(async (id: string) => ({
    ...mockApiToken,
    id,
    revokedOn: new Date('2026-01-02'),
}));

export const tokenExists = jest.fn(async (id: string) => {
    if (id === 'non-existent' || id === 'fake-token' || id === 'missing-id') {
        return false;
    }
    return true;
});
