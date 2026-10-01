import request from 'supertest';
import { app } from '../../../main';
import {
    getSiteAuth,
    getUserByEmail,
    initiatePasswordReset,
    validatePasswordReset,
    changePassword,
    completePasswordReset,
} from '../../../database/Users';
import { sendHtmlEmail } from '../../../communication/outgoing/Email';
import { requiresApiToken } from '../../shared';
import { pbkdf2Sync, randomBytes } from 'crypto';

jest.mock('../../../communication/outgoing/Email', () => ({
    sendHtmlEmail: jest.fn(),
}));

describe('POST /api/auth/login', () => {
    requiresApiToken((token) => {
        let req = request(app).post('/api/auth/login');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req.send({ username: 'testuser', password: 'password123' });
    });

    it('400 when username is missing or not a string', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('PlayBingo-Api-Key', 'token')
            .send({ username: 123, password: 'password123' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('invalid username - unable to parse');
    });

    it('400 when password is not a string', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('PlayBingo-Api-Key', 'token')
            .send({ username: 'testuser', password: 123 });
        expect(res.status).toBe(400);
        expect(getSiteAuth).not.toHaveBeenCalled();
    });

    it('401 when user is not found in getSiteAuth', async () => {
        (getSiteAuth as jest.Mock).mockResolvedValueOnce(undefined);
        const res = await request(app)
            .post('/api/auth/login')
            .set('PlayBingo-Api-Key', 'token')
            .send({ username: 'unknownuser', password: 'password123' });
        expect(res.status).toBe(401);
    });

    it('401 when password does not match stored hash', async () => {
        const salt = randomBytes(16);
        const correctHash = pbkdf2Sync(
            'correctPassword',
            salt,
            10000,
            64,
            'sha256',
        );
        (getSiteAuth as jest.Mock).mockResolvedValueOnce({
            id: 'user-1',
            password: correctHash,
            salt,
        });

        const res = await request(app)
            .post('/api/auth/login')
            .set('PlayBingo-Api-Key', 'token')
            .send({ username: 'testuser', password: 'wrongPassword' });
        expect(res.status).toBe(401);
    });

    it('200 when credentials are correct', async () => {
        const password = 'myPassword123';
        const salt = randomBytes(16);
        const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha256');
        (getSiteAuth as jest.Mock).mockResolvedValueOnce({
            id: 'user-1',
            password: hash,
            salt,
        });

        const res = await request(app)
            .post('/api/auth/login')
            .set('PlayBingo-Api-Key', 'token')
            .send({ username: 'testuser', password });
        expect(res.status).toBe(200);
    });
});

describe('POST /api/auth/forgotPassword', () => {
    requiresApiToken((token) => {
        let req = request(app).post('/api/auth/forgotPassword');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req.send({
            email: 'test@plabingo.gg',
            username: 'testuser',
        });
    });

    it('400 when email or username is missing', async () => {
        let res = await request(app)
            .post('/api/auth/forgotPassword')
            .set('PlayBingo-Api-Key', 'token')
            .send({ email: 'test@plabingo.gg' });
        expect(res.status).toBe(400);

        res = await request(app)
            .post('/api/auth/forgotPassword')
            .set('PlayBingo-Api-Key', 'token')
            .send({ username: 'testuser' });
        expect(res.status).toBe(400);
    });

    it('400 when user is not found by email', async () => {
        (getUserByEmail as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app)
            .post('/api/auth/forgotPassword')
            .set('PlayBingo-Api-Key', 'token')
            .send({ email: 'notfound@plabingo.gg', username: 'testuser' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Wrong email or username');
    });

    it('400 when username does not match user account', async () => {
        (getUserByEmail as jest.Mock).mockResolvedValueOnce({
            id: 'user-1',
            username: 'otheruser',
            email: 'test@plabingo.gg',
        });
        const res = await request(app)
            .post('/api/auth/forgotPassword')
            .set('PlayBingo-Api-Key', 'token')
            .send({ email: 'test@plabingo.gg', username: 'testuser' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Wrong email or username');
    });

    it('200 and sends email when valid', async () => {
        (getUserByEmail as jest.Mock).mockResolvedValueOnce({
            id: 'user-1',
            username: 'testuser',
            email: 'test@plabingo.gg',
        });
        const res = await request(app)
            .post('/api/auth/forgotPassword')
            .set('PlayBingo-Api-Key', 'token')
            .send({ email: 'test@plabingo.gg', username: 'testuser' });
        expect(res.status).toBe(200);
        expect(initiatePasswordReset).toHaveBeenCalledWith('user-1');
        expect(sendHtmlEmail).toHaveBeenCalledWith(
            'test@plabingo.gg',
            'PlayBingo Password Reset',
            'ForgotPassword',
            expect.objectContaining({
                username: 'testuser',
                resetLink: expect.stringContaining('reset-token'),
            }),
        );
    });
});

describe('POST /api/auth/resetPassword', () => {
    requiresApiToken((token) => {
        let req = request(app).post('/api/auth/resetPassword');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req.send({
            token: 'reset-token',
            password: 'newPassword123',
        });
    });

    it('400 when token or password is missing', async () => {
        let res = await request(app)
            .post('/api/auth/resetPassword')
            .set('PlayBingo-Api-Key', 'token')
            .send({ token: 'reset-token' });
        expect(res.status).toBe(400);

        res = await request(app)
            .post('/api/auth/resetPassword')
            .set('PlayBingo-Api-Key', 'token')
            .send({ password: 'newPassword123' });
        expect(res.status).toBe(400);
    });

    it('400 when token or password is not a string', async () => {
        const res = await request(app)
            .post('/api/auth/resetPassword')
            .set('PlayBingo-Api-Key', 'token')
            .send({ token: { value: 'reset-token' }, password: 123 });
        expect(res.status).toBe(400);
        expect(validatePasswordReset).not.toHaveBeenCalled();
    });

    it('400 when token is invalid or expired', async () => {
        (validatePasswordReset as jest.Mock).mockResolvedValueOnce(null);
        const res = await request(app)
            .post('/api/auth/resetPassword')
            .set('PlayBingo-Api-Key', 'token')
            .send({ token: 'invalid-token', password: 'newPassword123' });
        expect(res.status).toBe(400);
    });

    it('200 and updates password when token is valid', async () => {
        const res = await request(app)
            .post('/api/auth/resetPassword')
            .set('PlayBingo-Api-Key', 'token')
            .send({ token: 'reset-token', password: 'brandNewPassword' });
        expect(res.status).toBe(200);
        expect(changePassword).toHaveBeenCalledWith(
            'u1',
            expect.any(Buffer),
            expect.any(Buffer),
        );
        expect(completePasswordReset).toHaveBeenCalledWith('reset-token');
    });
});
