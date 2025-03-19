import request from 'supertest';
import { app } from '../main';
import http from 'http';
import { mockFindToken } from './setup';

let server: http.Server;

beforeAll(() => {
    // Start the server on a random port
    server = app.listen(0);
});

afterAll(async () => {
    // Close the server after tests
    await server.close();
});

describe('Basic Test to create a new user', () => {
    it('401 when no token', async () => {
        const res = await request(app)
            .post('/api/registration/register')
            .send({
                email: 'test@gmail.com',
                username: 'Test',
                password: 'password',
            })
            .expect(401);
        expect(mockFindToken).not.toHaveBeenCalled();
        expect(res.status).toBe(401);
    });
    it('401 when invalid token', async () => {
        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@gmail.com',
                username: 'Test',
                password: 'password',
            })
            .expect(401);
        expect(mockFindToken).toHaveBeenCalled();
        expect(res.status).toBe(401);
    });
    it('should create a new user when calling the corresponding route', async () => {
        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@gmail.com',
                username: 'Test',
                password: 'password',
            })
            .expect(201);
        expect(mockFindToken).toHaveBeenCalled();
        expect(res.status).toBe(201);
    });
});
