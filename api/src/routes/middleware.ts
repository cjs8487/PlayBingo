import { NextFunction, Request, Response } from 'express';
import { validateToken } from '../database/auth/ApiTokens';
import { logWarn } from '../Logger';

export const requiresApiToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const apiToken = req.header('PlayBingo-Api-Key');
    if (!apiToken) {
        res.sendStatus(401);
        return;
    }
    if (!(await validateToken(apiToken))) {
        logWarn('Invalid API Key');
        res.sendStatus(401);
        return;
    }
    next();
};
