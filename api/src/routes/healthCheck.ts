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
    } catch (error: Error) {
        healthCheck.message = error.message;
        res.sendStatus(500);
    }
});
