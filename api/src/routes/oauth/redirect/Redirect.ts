import { Router } from 'express';
import {
    clientUrl,
    racetimeClientId,
    racetimeClientSecret,
    racetimeHost,
} from '../../../Environment';
import {
    getAccessToken,
    registerUser as registerUserRacetime,
} from '../../../lib/RacetimeConnector';
import {
    createRacetimeConnection,
    createTwitchConnection,
} from '../../../database/Connections';
import { doCodeExchange } from '../../../lib/TwitchConnector';
import { logError, logWarn } from '../../../Logger';

export interface RacetimeTokenResponse {
    access_token: string;
    expires_in: 36000;
    token_type: string;
    scope: string;
    refresh_token: string;
}

interface RacetimeTokenErrorResponse {
    error: string;
}

const redirect = Router();

redirect.get('/racetime', async (req, res) => {
    const { user } = req.session;
    if (!user) {
        res.redirect(
            `${clientUrl}?type=error&message=Unable to connect account`,
        );
        return;
    }

    const code = req.query.code;
    if (typeof code !== 'string') {
        res.redirect(
            `${clientUrl}?type=error&message=Unable to connect account.`,
        );
        return;
    }

    const tokenRes = await fetch(`${racetimeHost}/o/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: racetimeClientId,
            client_secret: racetimeClientSecret,
            grant_type: 'authorization_code',
            code,
        }),
    });
    if (!tokenRes.ok) {
        const data = (await tokenRes.json()) as RacetimeTokenErrorResponse;
        res.redirect(
            `${clientUrl}?type=error&message=Unable to connect account - ${data.error}}`,
        );
    }

    const data = (await tokenRes.json()) as RacetimeTokenResponse;

    registerUserRacetime(
        user,
        data.access_token,
        data.refresh_token,
        data.expires_in,
    );
    const token = await getAccessToken(user);

    const userRes = await fetch(`${racetimeHost}/o/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) {
        res.redirect(
            `${clientUrl}?type=error&message=Unable to connect account`,
        );
        return;
    }
    const userData = (await userRes.json()) as {
        id: string;
        full_name: string;
    };

    createRacetimeConnection(user, userData.id, data.refresh_token);

    res.redirect(
        `${clientUrl}?type=success&message=Successfully connected to racetime.gg user ${userData.full_name}`,
    );
});

redirect.get('/twitch', async (req, res, next) => {
    const { user } = req.session;
    if (!user) {
        res.redirect(
            `${clientUrl}?type=error&message=Unable to connect account`,
        );
        return;
    }

    const code = req.query.code as string;
    const state = req.query.state as string;
    if (state !== req.session.state) {
        // state mismatch means this request is invalid
        logWarn(
            `A potentially malicious Twitch authorization request has been denied. Session id: ${req.session.id}`,
        );
        // destroy the session in case this is a malicious request
        req.session.destroy((err) => {
            if (err) next();
            res.redirect(
                `${clientUrl}?type=error&message=Unable to connect account`,
            );
        });
        return;
    }
    try {
        const firstToken = await doCodeExchange(code);
        if (!firstToken) {
            res.redirect(
                `${clientUrl}?type=error&message=Unable to connect account`,
            );
            return;
        }

        createTwitchConnection(
            user,
            firstToken.userId,
            firstToken.refreshToken ?? '',
        );
        res.redirect(
            `${clientUrl}?type=success&message=Successfully connected to Twitch`,
        );
    } catch (e: any) {
        logError(e);
        res.redirect(
            `${clientUrl}?type=error&message=Unable to connect account - ${e.message}`,
        );
    }
});

export default redirect;
