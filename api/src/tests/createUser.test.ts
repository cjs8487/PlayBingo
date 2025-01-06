import request from 'supertest';
import { app } from '../main';
import http from 'http';

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
    it('should create a new user when calling the corresponding route', async () => {
        const res = await request(app)
            .post('/api/registration/register')
            .send({
                email: 'test@gmail.com',
                username: 'Test',
                password: 'password',
            })
            .expect(201);

        expect(res.status).toBe(201);
    });
});
