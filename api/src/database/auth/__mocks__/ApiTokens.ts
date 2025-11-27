const apiTokens = jest.createMockFromModule('../ApiTokens') as any;

export const validateToken = jest.fn((token: string) => {
    console.log('mock implementation of validate token');
    return token === 'token';
});
