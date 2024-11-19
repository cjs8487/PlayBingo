import request from 'supertest';
import { app } from '../main';

describe('Basic Test to create a new user', () => {
    it('should create a new user when calling the corresponding route', () => {
        const res = request(app)
            .post('/register')
            .send({
                email: 'test@gmail.com',
                username: 'Test',
                password: 'password',
            })
            .expect(200);
    });
});
