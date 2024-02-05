import { randomBytes, randomUUID } from 'crypto';
import { prisma } from './Database';

const createClientSecret = () => randomBytes(16).toString();

// client database functions
export const createOAuthClient = (name: string, owner: string) => {
    return prisma.oAuthClient.create({
        data: {
            clientId: randomUUID(),
            clientSecret: createClientSecret(),
            name,
            owner: { connect: { id: owner } },
        },
    });
};

export const getClients = (owner: string) => {
    return prisma.oAuthClient.findMany({
        select: { id: true, name: true, clientId: true },
        where: { ownerId: owner },
    });
};

export const getClient = (id: string) => {
    return prisma.oAuthClient.findUnique({ where: { id } });
};

export const getClientById = (clientId: string) => {
    return prisma.oAuthClient.findUnique({ where: { clientId } });
};

export const authorizationMatch = async (
    clientId: string,
    clientSecret: string,
    redirectUri: string,
) => {
    const client = await getClientById(clientId);
    if (client) {
        return (
            clientId === client.clientId &&
            clientSecret === client.clientSecret &&
            client.redirectUris.includes(redirectUri)
        );
    }
    return false;
};

export const resetClientSecret = (clientId: string) => {
    return prisma.oAuthClient.update({
        where: { clientId },
        data: {
            clientSecret: createClientSecret(),
            tokens: { deleteMany: {} },
        },
    });
};

export const addRedirectUri = (clientId: string, redirectUri: string) => {
    return prisma.oAuthClient.update({
        where: { clientId },
        data: { redirectUris: { push: redirectUri } },
    });
};

export const deleteClient = (client: string) => {
    return prisma.oAuthClient.delete({ where: { id: client } });
};

// token database functions
export const getToken = (user: string, client: string) => {
    return prisma.oAuthToken.findUnique({
        where: {
            userId_oAuthClientId: { userId: user, oAuthClientId: client },
        },
    });
};

const createAuthToken = () => randomBytes(32).toString();
const createRefreshToken = () => randomBytes(16).toString();
const tokenExpiration = () => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today;
};

export const authorizeClient = (
    user: string,
    client: string,
    scopes: string[],
) => {
    return prisma.oAuthToken.upsert({
        where: {
            userId_oAuthClientId: { userId: user, oAuthClientId: client },
        },
        create: {
            user: { connect: { id: user } },
            client: { connect: { id: client } },
            token: createAuthToken(),
            refreshToken: createRefreshToken(),
            expires: tokenExpiration(),
            scopes,
        },
        update: {
            token: createAuthToken(),
            refreshToken: createRefreshToken(),
            expires: tokenExpiration(),
            scopes,
        },
    });
};

export const revokeToken = (user: string, client: string) => {
    return prisma.oAuthToken.delete({
        where: {
            userId_oAuthClientId: { userId: user, oAuthClientId: client },
        },
    });
};

export const getUserForToken = (token: string) => {
    return prisma.oAuthToken.findUnique({
        where: { token },
        select: { user: true },
    });
};

export const getTokenByRefreshToken = (refreshToken: string) => {
    return prisma.oAuthToken.findUnique({ where: { refreshToken } });
};
