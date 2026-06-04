import { randomBytes } from 'crypto';
import {
    authorizationMatch,
    authorizeClient,
    getClient,
    getClientById,
    getToken,
    getTokenByRefreshToken,
} from '../database/OAuth';

type OAuthReturnValue<T> =
    | { success: true; value: T }
    | { success: false; error: string };

interface AuthorizationCode {
    code: string;
    clientId: string;
    redirectUri: string;
    userId: string;
    scopes: string[];
}

const codes: Record<string, AuthorizationCode> = {};

// grants
export const grantCode = (
    clientId: string,
    redirectUri: string,
    scopes: string[],
    userId: string,
) => {
    const code = randomBytes(16).toString('base64url');
    codes[code] = {
        clientId,
        redirectUri,
        userId,
        scopes,
        code,
    };
    return code;
};

// exchanges
export const exchangeCode = async (
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    code: string,
): Promise<OAuthReturnValue<{ token: string; refreshToken: string }>> => {
    const authorizationCode = codes[code];
    if (!authorizationCode) {
        return { success: false, error: 'Invalid code' };
    }

    if (authorizationCode.clientId !== clientId) {
        return { success: false, error: 'Invalid client id' };
    }
    const client = await getClientById(clientId);
    if (!client) {
        return {
            success: false,
            error: 'Invalid client id',
        };
    }
    if (!authorizationMatch(clientId, clientSecret, redirectUri)) {
        return { success: false, error: 'Invalid client credentials' };
    }

    const token = await authorizeClient(
        authorizationCode.userId,
        client.id,
        authorizationCode.scopes,
    );
    if (!token) {
        return { success: false, error: 'Unable to create token' };
    }

    delete codes[code];
    return {
        success: true,
        value: {
            token: token.token,
            refreshToken: token.refreshToken,
        },
    };
};

export const exchangeRefreshToken = async (
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    refreshToken: string,
): Promise<OAuthReturnValue<{ token: string; refreshToken: string }>> => {
    const token = await getTokenByRefreshToken(refreshToken);
    if (!token) {
        return { success: false, error: 'Invalid refresh token' };
    }

    const client = await getClientById(clientId);
    if (!client) {
        return { success: false, error: 'Invalid client id' };
    }
    if (token.oAuthClientId !== client.id) {
        return { success: false, error: 'Invalid client id' };
    }
    if (!authorizationMatch(clientId, clientSecret, redirectUri)) {
        return { success: false, error: 'Invalid client credentials' };
    }

    const newToken = await authorizeClient(
        token.userId,
        client.id,
        token.scopes,
    );
    if (!newToken) {
        return { success: false, error: 'Unable to refresh token' };
    }
    return {
        success: true,
        value: {
            token: newToken.token,
            refreshToken: newToken.refreshToken,
        },
    };
};
