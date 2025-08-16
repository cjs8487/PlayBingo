import { Player as PlayerClientData, ServerMessage } from '@playbingo/types';
import { OPEN, WebSocket } from 'ws';
import { RoomTokenPayload } from '../auth/RoomAuth';
import { getAccessToken } from '../lib/RacetimeConnector';
import RaceHandler from './integration/races/RaceHandler';
import Room from './Room';
import { prisma } from '../database/Database';

/**
 * Represents a player connected to a room. While largely just a data class, this
 * class offers utilities to make keeping track of players, identities, and their
 * respective user associations easier. By default, players are not associated
 * with a user (and are considered distinct entities for all purposes), however,
 * over the lifecycle of a room, it is necessary to track when connections are
 * associated with users.
 *
 * Under most normal circumstances, the relationship between identities, players,
 * and users is exactly 1 to 1 to 1, however perfectly acceptable for many
 * identities to be associated with a single player (such as if a player is
 * connected via the website and a third party client simultaneously), or for
 * a single user to be connected to multiple players (such as if a category
 * moderator is spectating multiple rooms simultaneously). Direct connections
 * between users and identities are not tracked and are not particularly
 * meaningful.
 */
export default class Player {
    room: Room;
    /** Unique player identifier */
    id: string;
    /** Player display name */
    nickname: string;
    /** The players chosen color */
    color: string;
    userId?: string;
    /** If the player is in spectator mode or not */
    spectator: boolean;
    /** If the player has permission to perform monitor actions in the room */
    monitor: boolean;

    /** The number of goals the player has marked */
    goalCount: number;
    /** Whether or not the player has completed the goal of the room */
    goalComplete: boolean;

    /** Open connections for the player, mapped by the id in the auth token that
     * is authorized for the connection */
    connections: Map<string, WebSocket>;

    raceHandler: RaceHandler;
    raceId: string;

    constructor(
        room: Room,
        id: string,
        nickname: string,
        color: string = 'blue',
        spectator: boolean,
        monitor: boolean,
        userId?: string,
    ) {
        this.room = room;
        (this.id = id), (this.nickname = nickname);
        this.color = color;
        this.spectator = spectator;
        this.monitor = monitor;
        this.userId = userId;

        this.goalCount = 0;
        this.goalComplete = false;
        this.connections = new Map<string, WebSocket>();

        this.raceHandler = room.raceHandler;
        this.raceId = '';
    }

    doesTokenMatch(token: RoomTokenPayload) {
        return token.user === this.userId;
    }

    /**
     * Adds a websocket to this players communication list.
     *
     * @param id The auth token UUID for the connection
     * @param socket The socket the connection communicates over
     */
    addConnection(id: string, socket: WebSocket) {
        this.connections.set(id, socket);
    }

    /**
     * Removes the connection associated with the specified key from this
     * player
     *
     * @param id The auth token UUID for the connection
     * @returns true if the connection belonged to this player
     */
    closeConnection(id: string) {
        const socket = this.connections.get(id);
        if (socket) {
            socket.close();
            this.connections.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Handles the closing of a websocket without it having sent a leave message
     *
     * @param ws The websocket that closed
     * @returns true if this player owned the socket and it was cleaned up
     */
    handleSocketClose(ws: WebSocket) {
        let socketKey;
        this.connections.forEach((v, k) => {
            if (v === ws) {
                socketKey = k;
            }
        });
        if (socketKey) {
            this.connections.delete(socketKey);
            return true;
        }
        return false;
    }

    hasConnections() {
        return this.connections.size > 0;
    }

    /**
     * Converts the current state of the player to it's equivalent client
     * representation to be sent over WebSocket
     * @returns Client representation of this player's data
     */
    toClientData(): PlayerClientData {
        const raceUser = this.raceHandler.getPlayer(this.raceId);
        return {
            id: this.id,
            nickname: this.nickname,
            color: this.color,
            goalCount: this.goalCount,
            raceStatus: raceUser
                ? {
                      connected: true,
                      ...raceUser,
                  }
                : { connected: false },
            spectator: this.spectator,
            monitor: this.monitor,
        };
    }

    sendMessage(message: ServerMessage) {
        this.connections.forEach((socket) => {
            if (socket.readyState === OPEN) {
                socket.send(
                    JSON.stringify({
                        ...message,
                        connectedPlayer: this.toClientData(),
                    }),
                );
            }
        });
    }

    showInRoom() {
        return this.connections.size > 0;
    }

    //#region Races
    private async tryRaceAction(
        action: (token: string) => Promise<boolean>,
        failMsg: string,
    ) {
        if (this.userId) {
            const token = await getAccessToken(this.userId);
            if (token) {
                return action(token);
            } else {
                this.room.logInfo(`${failMsg} - failed to generate token`);
                return false;
            }
        } else {
            this.room.logInfo(`${failMsg} - player is anonymous`);
            return false;
        }
    }
    async joinRace() {
        return this.tryRaceAction(
            this.raceHandler.joinPlayer.bind(this.raceHandler),
            'Unable to join race room',
        );
    }

    async leaveRace() {
        return this.tryRaceAction(
            this.raceHandler.leavePlayer.bind(this.raceHandler),
            'Unable to leave race room',
        );
    }

    async ready() {
        return this.tryRaceAction(
            this.raceHandler.readyPlayer.bind(this.raceHandler),
            'Unable to ready in race room',
        );
    }
    async unready() {
        return this.tryRaceAction(
            this.raceHandler.unreadyPlayer.bind(this.raceHandler),
            'Unable to unready in race room',
        );
    }
    //#endregion
}
