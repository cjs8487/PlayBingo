import { Router } from 'express';

export const healthCheckRouter = Router();

healthCheckRouter.get('/', (req, res) => {
    const healthCheck = {
        upTime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
    };

    try {
        res.send(healthCheck);
    } catch (error: unknown) {
        healthCheck.message = (error as Error).message;
        res.sendStatus(500);
    }
});
