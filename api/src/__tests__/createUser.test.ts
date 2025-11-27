import request from 'supertest';
import { app } from '../main';
import { validateToken } from '../database/auth/ApiTokens';
import { registerUser } from '../database/Users';
import { prismaMock } from './setup';
import { mockValidTokenPayload, requiresApiToken } from './shared';
import { User } from '@prisma/client';
import { mock } from 'jest-mock-extended';

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
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue(mock<User>());
        const res = await request(app)
            .post('/api/registration/register')
            .set('PlayBingo-Api-Key', 'token')
            .send({
                email: 'test@gmail.com',
                username: 'Test',
                password: 'password',
            });
        expect(res.status).toBe(201);
        expect(validateToken).toHaveBeenCalled();
        expect(registerUser).toHaveBeenCalled();
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            select: { id: true },
            where: { username: 'Test' },
        });
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            select: { id: true },
            where: { email: 'test@gmail.com' },
        });
        expect(res.status).toBe(201);
    });
});
