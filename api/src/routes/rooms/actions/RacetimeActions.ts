import { ConnectionService } from '@prisma/client';
import Room from '../../../core/Room';
import { getRacetimeConfiguration } from '../../../database/games/Games';
import { connectRoomToRacetime } from '../../../database/Rooms';
import { racetimeHost } from '../../../Environment';
import { getAccessToken } from '../../../lib/RacetimeConnector';
import { ActionResult, unknownAction } from './Actions';
import { getConnectionForUser } from '../../../database/Connections';
import { RoomTokenPayload } from '../../../auth/RoomAuth';

export const handleRacetimeAction = async (
    room: Room,
    action: string,
    user: string,
    roomToken: RoomTokenPayload,
) => {
    const rtConnection = await getConnectionForUser(
        user,
        ConnectionService.RACETIME,
    );
    if (!rtConnection) {
        room.logInfo(
            'Unable to join a user to the racetime room - no racetime connection found',
        );
        return {
            code: 403,
            message: 'Forbidden',
        };
    }

    switch (action) {
        case 'create':
            if (!roomToken.isMonitor) {
                return {
                    code: 403,
                    message: 'Forbidden',
                };
            }
            return createRacetimeRoom(room, user);
        case 'refresh':
            return refreshConnection(room);
        case 'join':
            if (roomToken.isSpectating) {
                return {
                    code: 403,
                    message: 'Forbidden',
                };
            }
            return joinPlayer(room, roomToken, rtConnection.serviceId);
        case 'ready':
            if (roomToken.isSpectating) {
                return {
                    code: 403,
                    message: 'Forbidden',
                };
            }
            return readyPlayer(room, roomToken);
        case 'unready':
            if (roomToken.isSpectating) {
                return {
                    code: 403,
                    message: 'Forbidden',
                };
            }
            return unreadyPlayer(room, roomToken);
        default:
            return unknownAction(room);
    }
};

const createRacetimeRoom = async (
    room: Room,
    user: string,
): Promise<ActionResult> => {
    const racetimeConfiguration = await getRacetimeConfiguration(room.gameSlug);
    if (
        !racetimeConfiguration ||
        !racetimeConfiguration.racetimeCategory ||
        !racetimeConfiguration.racetimeGoal
    ) {
        return {
            code: 400,
            message:
                "This game isn't properly configured for racetime.gg integration",
        };
    }

    const token = await getAccessToken(user);
    if (!token) {
        return {
            code: 403,
            message: 'Unable to get auth token',
        };
    }

    const createRes = await fetch(
        `${racetimeHost}/o/${racetimeConfiguration.racetimeCategory}/startrace`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                start_delay: '15',
                time_limit: `24`,
                chat_message_delay: '0',
                goal: racetimeConfiguration.racetimeGoal,
            }),
        },
    );
    if (!createRes.ok) {
        return {
            code: 400,
            message: 'Invalid racetime configuration for the category',
        };
    }
    if (createRes.status !== 201) {
        // uh oh
        return {
            code: 500,
            message:
                'Received a response from racetime that the server does not know how to handle',
        };
    }

    const relativePath = createRes.headers.get('Location');
    if (!relativePath) {
        return {
            code: 500,
            message:
                'Received a response from racetime that the server does not know how to handle',
        };
    }
    const url = `${racetimeHost}${relativePath}`;
    await connectRoomToRacetime(room.slug, url).then();
    room.handleRacetimeRoomCreated(url);

    return {
        code: 200,
        value: { url },
    };
};

const refreshConnection = async (room: Room): Promise<ActionResult> => {
    room.refreshRacetimeHandler();
    return {
        code: 200,
        value: {},
    };
};

const joinPlayer = async (
    room: Room,
    roomToken: RoomTokenPayload,
    racetimeId: string,
): Promise<ActionResult> => {
    if (!room.joinRaceRoom(racetimeId, roomToken)) {
        return {
            code: 403,
            message: 'Forbidden',
        };
    }
    return {
        code: 200,
        value: {},
    };
};

const readyPlayer = async (
    room: Room,
    roomToken: RoomTokenPayload,
): Promise<ActionResult> => {
    if (!room.readyPlayer(roomToken)) {
        return {
            code: 403,
            message: 'Forbidden',
        };
    }
    return {
        code: 200,
        value: {},
    };
};

const unreadyPlayer = async (
    room: Room,
    roomToken: RoomTokenPayload,
): Promise<ActionResult> => {
    if (!room.unreadyPlayer(roomToken)) {
        return {
            code: 403,
            message: 'Forbidden',
        };
    }
    return {
        code: 200,
        value: {},
    };
};
