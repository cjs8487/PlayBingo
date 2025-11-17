import request from 'supertest';
import { app } from '../main';
import http from 'http';
import { mockFindToken } from './setup';
import { prisma } from '../database/Database';
import { requiresApiToken } from './shared';

let server: http.Server;

const mockCreateUser = jest.spyOn(prisma.user, 'create').mockResolvedValue({
    id: 'validuser',
    username: 'testuser',
    email: 'test@test.com',
    password: new Uint8Array(),
    salt: new Uint8Array(),
    avatar: null,
    staff: false,
});

const mockFindUnique = jest
    .spyOn(prisma.user, 'findUnique')
    .mockResolvedValue(null);

beforeAll(() => {
    // Start the server on a random port
    server = app.listen(0);
});

afterAll(async () => {
    // Close the server after tests
    await server.close();
});

describe('Basic Test to create a new user', () => {
    requiresApiToken((token) => {
        if (token) {
            return request(app)
                .post('/api/registration/register')
                .set('PlayBingo-Api-Key', token)
                .send({
                    email: 'test@gmail.com',
                    username: 'Test',
                    password: 'password',
                });
        } else {
            return request(app).post('/api/registration/register').send({
                email: 'test@gmail.com',
                username: 'Test',
                password: 'password',
            });
        }
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
        expect(mockCreateUser).toHaveBeenCalled();
        expect(mockFindUnique).toHaveBeenCalledWith({
            select: { id: true },
            where: { username: 'Test' },
        });
        expect(mockFindUnique).toHaveBeenCalledWith({
            select: { id: true },
            where: { email: 'test@gmail.com' },
        });
        expect(res.status).toBe(201);
    });
});
