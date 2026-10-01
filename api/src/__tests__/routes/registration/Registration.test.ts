import request from 'supertest';
import express from 'express';
import { app } from '../../../main';
import registrationRouter from '../../../routes/registration/Registration';
import { emailUsed, registerUser, usernameUsed } from '../../../database/Users';
import { requiresApiToken } from '../../shared';

describe('GET /api/registration/checkEmail', () => {
    requiresApiToken((token) => {
        let req = request(app).get(
            '/api/registration/checkEmail?email=test@plabingo.gg',
        );
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req;
    });

    it('400 when email parameter is missing', async () => {
        const res = await request(app)
            .get('/api/registration/checkEmail')
            .set('PlayBingo-Api-Key', 'token');
        expect(res.status).toBe(400);
    });

    it('200 valid: false when email is already in use', async () => {
        (emailUsed as jest.Mock).mockResolvedValueOnce(true);
        const res = await request(app)
            .get('/api/registration/checkEmail?email=used@plabingo.gg')
            .set('PlayBingo-Api-Key', 'token');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ valid: false });
    });

    it('200 valid: true when email is available', async () => {
        (emailUsed as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .get('/api/registration/checkEmail?email=fresh@plabingo.gg')
            .set('PlayBingo-Api-Key', 'token');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ valid: true });
    });
});

describe('GET /api/registration/checkUsername', () => {
    requiresApiToken((token) => {
        let req = request(app).get(
            '/api/registration/checkUsername?name=testuser',
        );
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req;
    });

    it('400 when name parameter is missing', async () => {
        const res = await request(app)
            .get('/api/registration/checkUsername')
            .set('PlayBingo-Api-Key', 'token');
        expect(res.status).toBe(400);
    });

    it('200 valid: false when username is already in use', async () => {
        (usernameUsed as jest.Mock).mockResolvedValueOnce(true);
        const res = await request(app)
            .get('/api/registration/checkUsername?name=existinguser')
            .set('PlayBingo-Api-Key', 'token');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ valid: false });
    });

    it('200 valid: true when username is available', async () => {
        (usernameUsed as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .get('/api/registration/checkUsername?name=newuser')
            .set('PlayBingo-Api-Key', 'token');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ valid: true });
    });
});

describe('POST /api/registration/register', () => {
    requiresApiToken((token) => {
        let req = request(app).post('/api/registration/register');
        if (token) {
            req = req.set('PlayBingo-Api-Key', token);
        }
        return req.send({
            email: 'test@plabingo.gg',
            username: 'ValidUser123',
            password: 'securepassword',
        });
    });

    it('400 when email is not a string', async () => {
        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 12345,
                username: 'ValidUser123',
                password: 'securepassword',
            });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid email - unable to parse');
    });

    it('400 when email has invalid format', async () => {
        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'invalid-email-format',
                username: 'ValidUser123',
                password: 'securepassword',
            });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid email - invalid format');
    });

    it('400 when email is already in use', async () => {
        (emailUsed as jest.Mock).mockResolvedValueOnce(true);
        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'used@plabingo.gg',
                username: 'ValidUser123',
                password: 'securepassword',
            });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid email - already used');
    });

    it('400 when username is not a string', async () => {
        (emailUsed as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@plabingo.gg',
                username: 12345,
                password: 'securepassword',
            });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid username - unable to parse');
    });

    it('400 when username format is invalid (special characters)', async () => {
        (emailUsed as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@plabingo.gg',
                username: 'Invalid-User!',
                password: 'securepassword',
            });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid username - invalid format');
        expect(usernameUsed).not.toHaveBeenCalled();
        expect(registerUser).not.toHaveBeenCalled();
    });

    it('400 when password is not a string', async () => {
        (emailUsed as jest.Mock).mockResolvedValueOnce(false);
        (usernameUsed as jest.Mock).mockResolvedValueOnce(false);
        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@plabingo.gg',
                username: 'ValidUser123',
                password: 12345,
            });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid password - unable to parse');
        expect(registerUser).not.toHaveBeenCalled();
    });

    it('400 when username is already in use', async () => {
        (emailUsed as jest.Mock).mockResolvedValueOnce(false);
        (usernameUsed as jest.Mock).mockResolvedValueOnce(true);
        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@plabingo.gg',
                username: 'TakenUsername',
                password: 'securepassword',
            });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Invalid username - already used');
    });

    it('400 when registerUser fails and returns falsy', async () => {
        (emailUsed as jest.Mock).mockResolvedValueOnce(false);
        (usernameUsed as jest.Mock).mockResolvedValueOnce(false);
        (registerUser as jest.Mock).mockResolvedValueOnce(false);

        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@plabingo.gg',
                username: 'ValidUser',
                password: 'securepassword',
            });
        expect(res.status).toBe(400);
    });

    it('201 when registration is successful', async () => {
        (emailUsed as jest.Mock).mockResolvedValueOnce(false);
        (usernameUsed as jest.Mock).mockResolvedValueOnce(false);
        (registerUser as jest.Mock).mockResolvedValueOnce('new-user-id-123');

        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@plabingo.gg',
                username: 'ValidUser',
                password: 'securepassword',
            });
        expect(res.status).toBe(201);
        expect(registerUser).toHaveBeenCalledWith(
            'test@plabingo.gg',
            'ValidUser',
            expect.any(Buffer),
            expect.any(Buffer),
        );
    });

    it('500 when session regenerate encounters error', async () => {
        const testApp = express();
        testApp.use(express.json());
        testApp.use((req, res, next) => {
            req.session = {
                regenerate: (cb: (err?: any) => void) =>
                    cb(new Error('Regenerate failed')),
                save: (cb: (err?: any) => void) => cb(),
            } as any;
            next();
        });
        testApp.use('/registration', registrationRouter);

        (emailUsed as jest.Mock).mockResolvedValueOnce(false);
        (usernameUsed as jest.Mock).mockResolvedValueOnce(false);
        (registerUser as jest.Mock).mockResolvedValueOnce('new-user-id-123');

        const res = await request(testApp)
            .post('/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@plabingo.gg',
                username: 'ValidUser',
                password: 'securepassword',
            });
        expect(res.status).toBe(500);
    });

    it('500 when session save encounters error', async () => {
        const testApp = express();
        testApp.use(express.json());
        testApp.use((req, res, next) => {
            req.session = {
                regenerate: (cb: (err?: any) => void) => cb(),
                save: (cb: (err?: any) => void) => cb(new Error('Save failed')),
            } as any;
            next();
        });
        testApp.use('/registration', registrationRouter);

        (emailUsed as jest.Mock).mockResolvedValueOnce(false);
        (usernameUsed as jest.Mock).mockResolvedValueOnce(false);
        (registerUser as jest.Mock).mockResolvedValueOnce('new-user-id-123');

        const res = await request(testApp)
            .post('/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@plabingo.gg',
                username: 'ValidUser',
                password: 'securepassword',
            });
        expect(res.status).toBe(500);
    });
});
