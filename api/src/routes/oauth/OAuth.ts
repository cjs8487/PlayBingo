import { OAuthClient } from '@playbingo/types';
import { randomBytes } from 'crypto';
import { Router } from 'express';
import {
    exchangeCode,
    exchangeRefreshToken,
    grantCode,
} from '../../auth/OAuth';
import {
    createOAuthClient,
    deleteClient,
    getClient,
    getClientById,
    getClients,
    getFullClientById,
    resetClientSecret,
    updateClient,
} from '../../database/OAuth';
import { getUser } from '../../database/Users';
import redirect from './redirect/Redirect';

const oauth = Router();

oauth.use('/redirect', redirect);

// oauth spec implementation
const transactionStore: Record<
    string,
    { clientId: string; redirectUri: string; userId: string; scopes: string[] }
> = {};

oauth
    .route('/authorize')
    .get(async (req, res) => {
        if (!req.session.user) {
            res.sendStatus(401);
            return;
        }
        const user = await getUser(req.session.user);
        if (!user) {
            res.sendStatus(401);
            return;
        }

        const { clientId, redirectUri, responseType, scopes } = req.query;

        if (!clientId) {
            res.status(400).send('Missing client id');
            return;
        }
        if (typeof clientId !== 'string') {
            res.status(400).send('Invalid client id');
            return;
        }

        if (!redirectUri) {
            res.status(400).send('Missing redirect uri');
            return;
        }
        if (typeof redirectUri !== 'string') {
            res.status(400).send('Invalid redirect uri');
            return;
        }

        if (!scopes) {
            res.status(400).send('Missing scopes');
            return;
        }
        if (typeof scopes !== 'string') {
            res.status(400).send('Invalid scopes');
            return;
        }

        if (!responseType) {
            res.status(400).send('Missing response type');
            return;
        }
        switch (responseType) {
            case 'code':
                break;
            default:
                res.status(400).send('Unsupported response type');
                return;
        }

        const client = await getFullClientById(clientId);
        if (!client) {
            res.sendStatus(404);
            return;
        }
        if (!client.redirectUris.includes(redirectUri)) {
            res.status(400).send('Invalid redirect uri');
            return;
        }

        const transactionId = randomBytes(32).toString('base64url');
        transactionStore[transactionId] = {
            clientId,
            redirectUri,
            userId: user.id,
            scopes: scopes.split(' '),
        };

        res.status(200).json({
            transactionId,
            client: {
                id: client.id,
                name: client.name,
                clientId: client.clientId,
                redirectUris: client.redirectUris,
            } as OAuthClient,
        });
    })
    .post(async (req, res) => {
        if (!req.session.user) {
            res.sendStatus(401);
            return;
        }

        const { transactionId } = req.body;

        // validate body input
        if (!transactionId) {
            res.status(400).send('Missing transaction id');
            return;
        }
        if (typeof transactionId !== 'string') {
            res.status(400).send('Invalid transaction id');
            return;
        }

        // retrieve and validate transaction
        const transaction = transactionStore[transactionId];
        if (!transaction) {
            res.status(403);
            return;
        }
        if (transaction.userId !== req.session.user) {
            res.status(403);
            return;
        }
        if (!transaction.redirectUri) {
            res.status(500).send(
                'Invalid transaction data retrieved from store. This is likely a bug with PlayBingo, please report it to the developers.',
            );
            return;
        }
        delete transactionStore[transactionId];

        const code = grantCode(
            transaction.clientId,
            transaction.redirectUri,
            transaction.scopes,
            transaction.userId,
        );

        res.redirect(`${transaction.redirectUri}?code=${code}`);
    });

oauth.post('/token', async (req, res) => {
    const { clientId, clientSecret, redirectUri, grantType } = req.body;

    if (!clientId || !clientSecret || !redirectUri || !grantType) {
        res.status(400).send('Missing required fields');
        return;
    }

    switch (grantType) {
        case 'authorization_code': {
            const { code } = req.body;
            if (!code) {
                res.status(400).send('Missing code');
                return;
            }
            const result = await exchangeCode(
                clientId,
                clientSecret,
                redirectUri,
                code,
            );
            if (!result.success) {
                res.status(400).send(result.error);
                return;
            }
            res.status(200).json(result.value);
            break;
        }
        case 'refresh_token': {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).send('Missing refresh token');
                return;
            }
            const result = await exchangeRefreshToken(
                clientId,
                clientSecret,
                redirectUri,
                refreshToken,
            );
            if (!result.success) {
                res.status(400).send(result.error);
                return;
            }
            res.status(200).json(result.value);
            break;
        }
        default:
            res.status(400).send('Unsupported grant type');
    }
});

// oauth client management
oauth.get('/clients', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    const clients = await getClients(req.session.user);
    res.status(200).json(clients);
});

oauth.get('/client', async (req, res) => {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
        res.status(400).send('Invalid client id');
        return;
    }

    const client = await getClientById(id);
    if (!client) {
        res.sendStatus(404);
        return;
    }
    res.status(200).json(client);
});
oauth.post('/client', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    const { name } = req.body;
    if (!name) {
        res.status(400).send('Missing client application name');
        return;
    }
    const client = await createOAuthClient(name, req.session.user);
    res.status(201).json(client);
});
oauth
    .route('/:id')
    .get(async (req, res) => {
        const { id } = req.params;
        const client = await getClient(id);
        if (!client) {
            res.sendStatus(404);
            return;
        }
        res.json(client);
    })
    .delete(async (req, res) => {
        const { id } = req.params;
        await deleteClient(id);
        res.sendStatus(200);
    })
    .post(async (req, res) => {
        const { id } = req.params;
        const { name, redirects } = req.body;
        if (!name && !redirects) {
            res.sendStatus(400);
            return;
        }
        const client = await updateClient(id, name, redirects);
        res.status(200).json(client);
    });

oauth.post('/:id/resetSecret', async (req, res) => {
    const { id } = req.params;
    const newSecret = await resetClientSecret(id);
    res.status(200).json(newSecret);
});

export default oauth;
