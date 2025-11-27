const apiTokens = jest.createMockFromModule('../ApiTokens') as any;

export const validateToken = jest.fn((token: string) => {
    return token === 'token';
});
