import oauth2orize from 'oauth2orize';
import {
    authorizeClient,
    getClientById,
    getTokenByRefreshToken,
} from '../database/OAuth';
import { randomBytes } from 'crypto';

export const server = oauth2orize.createServer();

server.serializeClient((client, done) => done(null, client.id));

server.deserializeClient(async (id, done) => {
    const client = await getClientById(id);
    if (!client) {
        return done(new Error('Unable to load client'));
    }
    return done(null, client);
});

const codes: Record<
    string,
    {
        clientId: string;
        redirectUri: string;
        userId: string;
        scopes: string[];
    }
> = {};

// grants
server.grant(
    oauth2orize.grant.code(
        (client, redirectUri, user, res, req, locals, issued) => {
            const code = randomBytes(8).toString();
            codes[code] = {
                clientId: client.clientId,
                redirectUri,
                userId: user.id,
                scopes: res.scope.split(','),
            };
            return issued(null, code);
        },
    ),
);

// exchanges
server.exchange(
    oauth2orize.exchange.code(
        async (client, code, redirectUri, body, authInfo, issued) => {
            const authCode = codes[code];
            if (!authCode) {
                return issued(new Error('Invalid code'));
            }
            if (
                client.id !== authCode.clientId ||
                redirectUri !== authCode.redirectUri
            ) {
                return issued(null, false);
            }

            const token = await authorizeClient(
                authCode.userId,
                client.id,
                authCode.scopes,
            );
            return issued(null, token.token, token.refreshToken);
        },
    ),
);

server.exchange(
    oauth2orize.exchange.refreshToken(
        async (client, refreshToken, scope, issued) => {
            const token = await getTokenByRefreshToken(refreshToken);
            if (!token) {
                return issued(new Error('Token not found'));
            }
            if (client.id !== token.oAuthClientId) {
                return issued(new Error('Token not found'));
            }
            const newToken = await authorizeClient(
                token.userId,
                client.id,
                scope,
            );
            return issued(null, newToken.token, newToken.refreshToken);
        },
    ),
);
