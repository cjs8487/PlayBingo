import { Request, Response, NextFunction } from 'express';
import { requiresApiToken } from '../../routes/middleware';
import { validateToken } from '../../database/auth/ApiTokens';

describe('requiresApiToken middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            header: jest.fn(),
        };
        res = {
            sendStatus: jest.fn(),
        };
        next = jest.fn();
    });

    it('401 when the PlayBingo-Api-Key header is missing', async () => {
        (req.header as jest.Mock).mockReturnValue(undefined);
        await requiresApiToken(req as Request, res as Response, next);
        expect(res.sendStatus).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('401 when the PlayBingo-Api-Key is invalid', async () => {
        (req.header as jest.Mock).mockReturnValue('invalid-key');
        (validateToken as jest.Mock).mockResolvedValueOnce(false);
        await requiresApiToken(req as Request, res as Response, next);
        expect(res.sendStatus).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next when the PlayBingo-Api-Key is valid', async () => {
        (req.header as jest.Mock).mockReturnValue('token');
        (validateToken as jest.Mock).mockResolvedValueOnce(true);
        await requiresApiToken(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
        expect(res.sendStatus).not.toHaveBeenCalled();
    });
});
