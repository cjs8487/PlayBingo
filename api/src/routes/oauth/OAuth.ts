import { Router, Request } from 'express';
import { server } from '../../auth/OAuth';
import {
    createOAuthClient,
    deleteClient,
    getClient,
    getClientById,
    getClients,
    resetClientSecret,
    updateClient,
} from '../../database/OAuth';
import { getUser } from '../../database/Users';
import redirect from './redirect/Redirect';
import { OAuthClient } from '@playbingo/types';

interface OAuthRequest extends Request {
    oauth2?: {
        transactionID: string;
        client: OAuthClient;
    };
}

const oauth = Router();

oauth.use('/redirect', redirect);
oauth.get('/token', server.token(), server.errorHandler());

oauth.get(
    '/authorize',
    (req, res, next) => {
        if (!req.session.user) {
            return res.sendStatus(401);
        }
        next();
    },
    server.authorization(async (clientId, redirectUri, scopes, type, done) => {
        const client = await getClientById(clientId);
        if (!client) {
            return done(new Error('Invalid client id'));
        }
        if (!client.redirectUris.includes(redirectUri)) {
            return done(new Error('Invalid redirect uri'));
        }
        return done(null, client, redirectUri);
    }),
    (req: OAuthRequest, res) => {
        if (!req.oauth2) {
            return res.status(500).send('Unable to read transaction data');
        }
        res.status(200).json({
            transactionId: req.oauth2.transactionID,
            client: req.oauth2.client,
        });
    },
);

oauth.post(
    '/authorize',
    async (req, res, next) => {
        if (!req.session.user) {
            return res.sendStatus(401);
        }
        req.user = (await getUser(req.session.user)) ?? undefined;
        next();
    },
    server.decision(),
);

oauth.post(
    '/token',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    async (req, res, next) => {
        req.user = await getClientById(req.body.client_id);
        next();
    },
    server.token(),
    server.errorHandler(),
);

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
