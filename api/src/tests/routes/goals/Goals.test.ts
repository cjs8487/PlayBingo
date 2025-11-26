import { prisma } from '../../../database/Database';
import { gameForGoal } from '../../../database/games/Goals';
import { app } from '../../../main';
import { requiresGameModerator } from '../../shared';
import request from 'supertest';

describe('POST /api/goals/:id', () => {
    requiresGameModerator((cookie) => {
        let req = request(app).post('/api/goals/1');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        return req.send({});
    });
});
