export const isModerator = jest.fn((slug: string, user: string) => {
    return user === 'test-user-mod' || user === 'test-user-owner';
});

export const isOwner = jest.fn((slug: string, user: string) => {
    return user === 'test-user-owner';
});
