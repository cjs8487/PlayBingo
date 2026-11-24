import Room, { RacetimeCreationInputs } from '../../../core/Room';
import { racetimeHost } from '../../../Environment';
import { ActionResult, unknownAction } from './Actions';
import { RoomTokenPayload } from '../../../auth/RoomAuth';

export const handleRacetimeAction = async (
    room: Room,
    action: string,
    user: string,
    roomToken: RoomTokenPayload,
) => {
    let identity: Promise<string | undefined> | undefined;
    room.emit(
        'racetime:identityRequested',
        user,
        (result: Promise<string | undefined>) => {
            identity = result;
        },
    );
    const racetimeId = await identity;
    if (!racetimeId) {
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
            return joinPlayer(room, roomToken, racetimeId);
        case 'leave':
            if (roomToken.isSpectating) {
                return {
                    code: 403,
                    message: 'Forbidden',
                };
            }
            return leavePlayer(room, roomToken);
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
    let inputs: Promise<RacetimeCreationInputs | undefined> | undefined;
    room.emit(
        'racetime:creationInputsRequested',
        user,
        (result: Promise<RacetimeCreationInputs | undefined>) => {
            inputs = result;
        },
    );
    const configuration = await inputs;
    if (!configuration?.category || !configuration.goal) {
        return {
            code: 400,
            message:
                "This game isn't properly configured for racetime.gg integration",
        };
    }

    const { category, goal, token } = configuration;
    if (!token) {
        return {
            code: 403,
            message: 'Unable to get auth token',
        };
    }

    const createRes = await fetch(`${racetimeHost}/o/${category}/startrace`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            start_delay: '15',
            time_limit: `24`,
            chat_message_delay: '0',
            goal,
        }),
    });
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
    await room.handleRacetimeRoomCreated(url);

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

const leavePlayer = async (
    room: Room,
    roomToken: RoomTokenPayload,
): Promise<ActionResult> => {
    if (!room.leaveRaceRoom(roomToken)) {
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
