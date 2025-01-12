import { randomUUID } from 'crypto';
import { prisma } from '../Database';
import { eApiKey } from '../../Environment';

export const getAllTokens = async () => {
    const tokens = await prisma.apiToken.findMany({
        orderBy: { createdOn: 'asc' },
    });
    return tokens.map((token) => ({
        id: token.id,
        name: token.name,
        token: token.token,
        active: token.active,
        revokedOn: token.revokedOn,
    }));
};

export const createApiToken = async (name: string) => {
    const token = randomUUID();
    return prisma.apiToken.create({
        data: {
            name,
            token,
        },
    });
};

export const deactivateToken = async (id: string) => {
    return prisma.apiToken.update({
        where: { id },
        data: {
            active: false,
        },
    });
};

export const activateToken = async (id: string) => {
    return prisma.apiToken.update({
        where: { id },
        data: {
            active: true,
        },
    });
};

export const revokeToken = async (id: string) => {
    return prisma.apiToken.update({
        where: { id },
        data: { revokedOn: new Date() },
    });
};

export const tokenExists = async (id: string) => {
    return !!prisma.apiToken.findUnique({ where: { id } });
};

export const validateToken = async (token: string) => {
    if (eApiKey && token === eApiKey) {
        return true;
    }
    const tokenObj = await prisma.apiToken.findUnique({ where: { token } });
    if (!tokenObj) {
        return false;
    }
    if (tokenObj.revokedOn && new Date() < tokenObj.revokedOn) {
        return false;
    }
    return tokenObj.active;
};
