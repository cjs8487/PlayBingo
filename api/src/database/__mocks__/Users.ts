import { PasswordReset, User } from '@prisma/client';
import { mock } from 'jest-mock-extended';

const actualUsers = jest.requireActual('../Users');

export const mockUser = mock<User>();
mockUser.id = 'u1';
mockUser.username = 'test-user';
mockUser.email = 'test-user@plabingo.gg';
mockUser.password = Buffer.from('$2b$10$abcdefghijklmnopqrstuv');
mockUser.salt = Buffer.from('salt123');

export const mockPasswordReset = mock<PasswordReset>();
mockPasswordReset.userId = 'u1';
mockPasswordReset.token = 'reset-token';

export const getUser = jest.fn(async (username: string) => {
    if (!username || username === 'non-existent' || username === 'unknown') {
        return null;
    }
    const isStaffUser = username === 'test-user-staff' || username === 'staff';
    return {
        id: username,
        username,
        staff: isStaffUser,
        avatar: null,
        email: `${username}@plabingo.gg`,
        racetimeConnected: false,
    };
});

export const getUserByEmail = jest.fn(async (email: string) => {
    if (
        email === 'non-existent@plabingo.gg' ||
        email === 'unknown@plabingo.gg'
    ) {
        return null;
    }
    return mockUser;
});

export const getSiteAuth = jest.fn(async (username: string) => {
    if (username === 'invalid' || username === 'non-existent') {
        return undefined;
    }
    return mockUser;
});

export const getSiteAuthId = jest.fn(async (id: string) => {
    if (id === 'invalid' || id === 'non-existent') {
        return undefined;
    }
    return mockUser;
});

export const userByEmail = jest.fn(actualUsers.userByEmail);
export const userByUsername = jest.fn(actualUsers.userByUsername);
export const emailUsed = jest.fn(actualUsers.emailUsed);
export const usernameUsed = jest.fn(actualUsers.usernameUsed);

export const registerUser = jest.fn(actualUsers.registerUser);
export const isStaff = jest.fn(
    async (id: string) => id === 'test-user-staff' || id === 'staff',
);
export const getAllUsers = jest.fn(async () => [mockUser]);
export const getUsersEligibleToModerateGame = jest.fn(
    async (slug: string) => [],
);
export const updateUsername = jest.fn(async (id: string, username: string) => ({
    id,
    username,
}));
export const updateEmail = jest.fn(async (id: string, email: string) => ({
    id,
    email,
}));
export const updateAvatar = jest.fn(
    async (id: string, avatar: string | null) => ({ id, avatar }),
);
export const changePassword = jest.fn(
    async (id: string, password: Buffer, salt: Buffer) => ({ id }),
);

export const initiatePasswordReset = jest.fn(
    async (user: string) => mockPasswordReset,
);

export const validatePasswordReset = jest.fn(async (token: string) => {
    if (token === 'invalid-token' || token === 'expired-token') {
        return false;
    }
    return mockPasswordReset;
});

export const completePasswordReset = jest.fn(
    async (token: string) => mockPasswordReset,
);
