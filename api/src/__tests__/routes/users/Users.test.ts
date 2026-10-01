import request from 'supertest';
import {
    changePassword,
    emailUsed,
    getAllUsers,
    getUser,
    updateAvatar,
    updateEmail,
    updateUsername,
    usernameUsed,
} from '../../../database/Users';
import { validatePassword } from '../../../lib/Auth';
import { app } from '../../../main';
import { deleteFile, saveFile } from '../../../media/MediaServer';
import { removeSessionsForUser } from '../../../util/Session';
import {
    getTestSessionCookie,
    requiresApiToken,
    requiresLogin,
} from '../../shared';

jest.mock('../../../lib/Auth', () => {
    const original = jest.requireActual('../../../lib/Auth');
    return {
        ...original,
        validatePassword: jest.fn(),
    };
});

jest.mock('../../../media/MediaServer');

jest.mock('../../../util/Session', () => {
    const original = jest.requireActual('../../../util/Session');
    return {
        ...original,
        removeSessionsForUser: jest.fn().mockResolvedValue(undefined),
    };
});

let playerCookie = '';
const apiKey = 'valid-token';

const makeProfileRequest = () =>
    request(app)
        .post('/api/users/test-user')
        .set('PlayBingo-Api-Key', apiKey)
        .set('Cookie', playerCookie);

beforeAll(async () => {
    playerCookie = await getTestSessionCookie('player');
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /api/users', () => {
    it('200 and returns all users', async () => {
        const mockUsers = [
            { id: 'u1', username: 'alice' },
            { id: 'u2', username: 'bob' },
        ];
        (getAllUsers as jest.Mock).mockResolvedValueOnce(mockUsers);

        const res = await request(app).get('/api/users');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockUsers);
    });
});

describe('POST /api/users/:id', () => {
    requiresApiToken((token) => {
        let req = request(app).post('/api/users/u1');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req.send({ username: 'newname' });
    });

    requiresLogin(() =>
        request(app)
            .post('/api/users/test-user')
            .set('PlayBingo-Api-Key', apiKey)
            .send({ username: 'newname' }),
    );

    it('403 when the session user does not match the target user', async () => {
        const res = await request(app)
            .post('/api/users/other-user')
            .set('PlayBingo-Api-Key', apiKey)
            .set('Cookie', playerCookie)
            .send({ username: 'newname' });
        expect(res.status).toBe(403);
        expect(getUser).not.toHaveBeenCalled();
    });

    it('400 when missing profile update data (no username and no email)', async () => {
        const res = await makeProfileRequest().send({});
        expect(res.status).toBe(400);
        expect(res.text).toBe('Missing profile update data');
    });

    it('404 when user not found', async () => {
        (getUser as jest.Mock).mockResolvedValueOnce(null);
        const res = await makeProfileRequest().send({ username: 'newname' });
        expect(res.status).toBe(404);
        expect(getUser).toHaveBeenCalledWith('test-user', true);
    });

    it('400 when no changes made', async () => {
        (getUser as jest.Mock).mockResolvedValueOnce({
            id: 'u1',
            username: 'alice',
            email: 'alice@test.com',
            avatar: 'avatar.png',
        });
        const res = await makeProfileRequest().send({
            username: 'alice',
            email: 'alice@test.com',
            avatar: 'avatar.png',
        });
        expect(res.status).toBe(400);
        expect(res.text).toBe('No changes made');
    });

    it('400 when username format is invalid (not a string)', async () => {
        (getUser as jest.Mock).mockResolvedValueOnce({
            id: 'u1',
            username: 'alice',
            email: 'alice@test.com',
            avatar: null,
        });
        const res = await makeProfileRequest().send({ username: 12345 });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid username format');
    });

    it('400 when username is unavailable', async () => {
        (getUser as jest.Mock).mockResolvedValueOnce({
            id: 'u1',
            username: 'alice',
            email: 'alice@test.com',
            avatar: null,
        });
        (usernameUsed as jest.Mock).mockResolvedValueOnce(true);

        const res = await makeProfileRequest().send({ username: 'bob' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Username unavailable');
    });

    it('400 when email format is invalid (not a string)', async () => {
        (getUser as jest.Mock).mockResolvedValueOnce({
            id: 'u1',
            username: 'alice',
            email: 'alice@test.com',
            avatar: null,
        });
        const res = await makeProfileRequest().send({
            email: ['not', 'string'],
        });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid email format');
    });

    it('400 when email is unavailable', async () => {
        (getUser as jest.Mock).mockResolvedValueOnce({
            id: 'u1',
            username: 'alice',
            email: 'alice@test.com',
            avatar: null,
        });
        (emailUsed as jest.Mock).mockResolvedValueOnce(true);

        const res = await makeProfileRequest().send({
            email: 'bob@test.com',
        });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Email unavailable');
    });

    it('400 when avatar format is invalid', async () => {
        (getUser as jest.Mock).mockResolvedValueOnce({
            id: 'u1',
            username: 'alice',
            email: 'alice@test.com',
            avatar: null,
        });
        const res = await makeProfileRequest().send({
            username: 'alicia',
            avatar: 999,
        });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid avatar value');
    });

    it('400 when avatar fails to save', async () => {
        (getUser as jest.Mock).mockResolvedValueOnce({
            id: 'u1',
            username: 'alice',
            email: 'alice@test.com',
            avatar: null,
        });
        (usernameUsed as jest.Mock).mockResolvedValueOnce(false);
        (saveFile as jest.Mock).mockResolvedValueOnce(false);

        const res = await makeProfileRequest().send({
            username: 'alicia',
            avatar: 'bad-avatar.png',
        });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid cover image');
    });

    it('200 and updates username, email, and avatar', async () => {
        (getUser as jest.Mock).mockResolvedValueOnce({
            id: 'u1',
            username: 'alice',
            email: 'alice@test.com',
            avatar: null,
        });
        (usernameUsed as jest.Mock).mockResolvedValueOnce(false);
        (emailUsed as jest.Mock).mockResolvedValueOnce(false);
        (saveFile as jest.Mock).mockResolvedValueOnce(true);

        const res = await makeProfileRequest().send({
            username: 'alicia',
            email: 'alicia@test.com',
            avatar: 'new-avatar.png',
        });
        expect(res.status).toBe(200);
        expect(updateUsername).toHaveBeenCalledWith('test-user', 'alicia');
        expect(updateEmail).toHaveBeenCalledWith(
            'test-user',
            'alicia@test.com',
        );
        expect(updateAvatar).toHaveBeenCalledWith(
            'test-user',
            'new-avatar.png',
        );
    });

    it('200 and removes avatar when shouldRemoveAvatar is true', async () => {
        (getUser as jest.Mock).mockResolvedValueOnce({
            id: 'u1',
            username: 'alice',
            email: 'alice@test.com',
            avatar: 'old-avatar.png',
        });
        (usernameUsed as jest.Mock).mockResolvedValueOnce(false);

        const res = await makeProfileRequest().send({
            username: 'alicia',
            shouldRemoveAvatar: true,
        });
        expect(res.status).toBe(200);
        expect(deleteFile).toHaveBeenCalledWith('userAvatar', 'old-avatar.png');
        expect(updateAvatar).toHaveBeenCalledWith('test-user', null);
    });
});

describe('POST /api/users/:id/changePassword', () => {
    requiresApiToken((token) => {
        let req = request(app).post('/api/users/test-user/changePassword');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req.send({ currentPassword: 'old', newPassword: 'new' });
    });

    it('403 when user is not logged in session', async () => {
        const res = await request(app)
            .post('/api/users/test-user/changePassword')
            .set('PlayBingo-Api-Key', apiKey)
            .send({ currentPassword: 'old', newPassword: 'new' });
        expect(res.status).toBe(403);
    });

    it('403 when session user does not match target id', async () => {
        const res = await request(app)
            .post('/api/users/other-user/changePassword')
            .set('PlayBingo-Api-Key', apiKey)
            .set('Cookie', playerCookie)
            .send({ currentPassword: 'old', newPassword: 'new' });
        expect(res.status).toBe(403);
    });

    it('403 when currentPassword is missing', async () => {
        const res = await request(app)
            .post('/api/users/test-user/changePassword')
            .set('PlayBingo-Api-Key', apiKey)
            .set('Cookie', playerCookie)
            .send({ newPassword: 'new' });
        expect(res.status).toBe(403);
    });

    it('403 when currentPassword validation fails', async () => {
        (validatePassword as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .post('/api/users/test-user/changePassword')
            .set('PlayBingo-Api-Key', apiKey)
            .set('Cookie', playerCookie)
            .send({
                currentPassword: 'wrong-password',
                newPassword: 'new',
            });
        expect(res.status).toBe(403);
        expect(res.text).toBe('Incorrect password ');
    });

    it('400 when newPassword is missing', async () => {
        (validatePassword as jest.Mock).mockResolvedValueOnce(true);
        const res = await request(app)
            .post('/api/users/test-user/changePassword')
            .set('PlayBingo-Api-Key', apiKey)
            .set('Cookie', playerCookie)
            .send({ currentPassword: 'correct-password' });
        expect(res.status).toBe(400);
    });

    it('200 and updates password and removes sessions on success', async () => {
        (validatePassword as jest.Mock).mockResolvedValueOnce(true);

        const res = await request(app)
            .post('/api/users/test-user/changePassword')
            .set('PlayBingo-Api-Key', apiKey)
            .set('Cookie', playerCookie)
            .send({
                currentPassword: 'correct-password',
                newPassword: 'new-secure-password',
            });
        expect(res.status).toBe(200);
        expect(changePassword).toHaveBeenCalledWith(
            'test-user',
            expect.any(Buffer),
            expect.any(Buffer),
        );
        expect(removeSessionsForUser).toHaveBeenCalledWith('test-user');
    });
});
