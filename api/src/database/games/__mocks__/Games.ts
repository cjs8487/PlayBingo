import { Game } from '@prisma/client';
import { mock } from 'jest-mock-extended';

export const gameForSlug = jest.fn((slug: string) => {
    if (slug === 'invalid') {
        return null;
    }
    return mock<Game>();
});

export const isModerator = jest.fn((slug: string, user: string) => {
    return user === 'test-user-mod' || user === 'test-user-owner';
});

export const isOwner = jest.fn((slug: string, user: string) => {
    return user === 'test-user-owner';
});

export const updateSRLv5Enabled = jest.fn(
    (slug: string, enableSRLv5: boolean) => mock<Game>(),
);
