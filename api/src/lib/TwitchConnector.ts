import {
    AccessToken,
    RefreshingAuthProvider,
    refreshUserToken,
} from '@twurple/auth';
import {
    twitchClientId,
    twitchClientSecret,
    twitchRedirect,
} from '../Environment';
import { ConnectionService } from '@prisma/client';
import {
    getConnectionForUser,
    getUserForService,
    updateRefreshToken,
} from '../database/Connections';
import { ApiClient } from '@twurple/api';

const authProvider = new RefreshingAuthProvider({
    clientId: twitchClientId,
    clientSecret: twitchClientSecret,
    redirectUri: twitchRedirect,
});
authProvider.onRefresh(async (userId, newToken) => {
    const user = await getUserForService(ConnectionService.TWITCH, userId);
    if (!user) return;
    updateRefreshToken(
        user,
        ConnectionService.TWITCH,
        newToken.refreshToken ?? '',
    );
});

export const apiClient = new ApiClient({ authProvider });

export const registerUserAuth = (
    token: AccessToken,
    twitchId?: string,
): void => {
    if (twitchId) {
        authProvider.addUser(twitchId, token);
    } else {
        authProvider.addUserForToken(token);
    }
};

export const doCodeExchange = async (code: string) => {
    const twitchId = await authProvider.addUserForCode(code);
    return authProvider.getAccessTokenForUser(twitchId);
};

export const isUserRegistered = (twitchId: string) =>
    authProvider.hasUser(twitchId);

export const getAccessToken = async (
    user: string,
): Promise<string | undefined> => {
    const connection = await getConnectionForUser(
        user,
        ConnectionService.TWITCH,
    );
    if (!connection) {
        return;
    }
    if (isUserRegistered(connection.serviceId)) {
        const token = await authProvider.getAccessTokenForUser(
            connection.serviceId,
        );
        if (!token) {
            return;
        }
        return token.accessToken;
    }
    if (!connection.refreshToken) {
        return;
    }
    const token = await refreshUserToken(
        twitchClientId,
        twitchClientSecret,
        connection.refreshToken,
    );
    if (!token) {
        return;
    }
    authProvider.addUserForToken(token);
    return token.accessToken;
};
