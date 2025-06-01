import { Router } from 'express';
import {
    racetimeClientId,
    racetimeHost,
    twitchClientId,
    twitchRedirect,
} from '../../Environment';
import { createHash } from 'crypto';

const connect = Router();

const rtScopes = ['read', 'race_action', 'create_race'];

connect.get('/racetime', (req, res) => {
    res.redirect(
        `${racetimeHost}/o/authorize?client_id=${racetimeClientId}&response_type=code&scope=${rtScopes.join(
            '+',
        )}`,
    );
});

const twitchAuthRoot = 'https://id.twitch.tv/oauth2/authorize';
const twitchRedirectUrl = encodeURIComponent(twitchRedirect);
const twitchScopeList = ['user:edit:broadcast'];
const twitchScopes = `scope=${encodeURIComponent(twitchScopeList.join(' '))}`;
const twitchAuthUrl = `${twitchAuthRoot}?client_id=${twitchClientId}&redirect_uri=${twitchRedirectUrl}&${twitchScopes}&response_type=code`;

connect.get('/twitch', (req, res) => {
    const sessionHash = createHash('sha256');
    sessionHash.update(req.session.id);
    sessionHash.update(`${Date.now()}`);
    const state = sessionHash.digest('base64url');
    req.session.state = state;
    res.redirect(`${twitchAuthUrl}&state=${state}`);
});

export default connect;
