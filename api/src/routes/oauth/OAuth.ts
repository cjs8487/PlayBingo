import { Router } from 'express';
import { server } from '../../auth/OAuth';
import {
    createOAuthClient,
    deleteClient,
    getClient,
    getClients,
    resetClientSecret,
    updateClient,
} from '../../database/OAuth';
import redirect from './redirect/Redirect';

const oauth = Router();

oauth.use('/redirect', redirect);

oauth.post('/authorize', server.decision());
oauth.get('/token', server.token(), server.errorHandler());

oauth.get('/clients', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    const clients = await getClients(req.session.user);
    res.status(200).json(clients);
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
