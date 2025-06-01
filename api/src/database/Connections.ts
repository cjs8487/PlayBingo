import { ConnectionService } from '@prisma/client';
import { prisma } from './Database';

const createConnection = (
    user: string,
    service: ConnectionService,
    serviceId: string,
    refreshToken: string,
) => {
    return prisma.connection.create({
        data: {
            user: { connect: { id: user } },
            service,
            serviceId,
            refreshToken,
        },
    });
};

export const createRacetimeConnection = async (
    user: string,
    racetimeId: string,
    refreshToken: string,
) => {
    return createConnection(
        user,
        ConnectionService.RACETIME,
        racetimeId,
        refreshToken,
    );
};

export const createTwitchConnection = async (
    user: string,
    twitchId: string,
    refreshToken: string,
) => {
    return createConnection(
        user,
        ConnectionService.TWITCH,
        twitchId,
        refreshToken,
    );
};

export const updateRefreshToken = async (
    user: string,
    service: ConnectionService,
    newToken: string,
) => {
    const connection = await getConnectionForUser(user, service);
    if (!connection) {
        return;
    }
    return prisma.connection.update({
        where: { id: connection.id },
        data: { refreshToken: newToken },
    });
};

export const getConnectionForUser = (
    user: string,
    service: ConnectionService,
) => {
    return prisma.connection.findFirst({
        where: { user: { id: user }, service },
    });
};

export const deleteConnection = async (
    user: string,
    service: ConnectionService,
) => {
    const connection = await getConnectionForUser(user, service);
    if (!connection) {
        return;
    }
    return prisma.connection.delete({ where: { id: connection.id } });
};

export const getUserForService = async (
    service: ConnectionService,
    serviceId: string,
) => {
    return (
        await prisma.connection.findUnique({
            where: {
                serviceUnique: { service, serviceId },
            },
        })
    )?.userId;
};
