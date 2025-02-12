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
        return res.sendStatus(401);
    }
    if (!(await validateToken(apiToken))) {
        logWarn('Invalid API Key');
        return res.sendStatus(401);
    }
    next();
};
