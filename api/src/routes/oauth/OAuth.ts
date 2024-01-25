import { Router } from 'express';
import { server } from '../../auth/OAuth';
import {
    createOauthClient,
    deleteClient,
    getClient,
} from '../../database/OAuth';
import redirect from './redirect/Redirect';

const oauth = Router();

oauth.use('/redirect', redirect);

oauth.post('/authorize', server.decision());
oauth.get('/token', server.token(), server.errorHandler());

oauth.post('/client', async (req, res) => {
    const { name, redirectUris } = req.body;
    if (!name) {
        res.status(400).send('Missing client application name');
        return;
    }
    if (!redirectUris) {
        res.status(400).send('Missing redirect uris');
        return;
    }
    if (!Array.isArray(redirectUris)) {
        res.status(400).send('Invalid redirect uri list');
        return;
    }

    //TODO: validate individual elements of uri list
    const client = await createOauthClient(name, redirectUris);
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
    });

export default oauth;
