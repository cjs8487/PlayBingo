import {
    Player as PlayerClientData,
    ServerMessage,
    HiddenCell,
    RevealedCell
} from '@playbingo/types';
import { OPEN, WebSocket } from 'ws';
import { RoomTokenPayload } from '../auth/RoomAuth';
import Room from './Room';

type BoardViewProvider = () => (RevealedCell | HiddenCell)[][];

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
    /** If the player has permission to perform monitor actions in the room */
    monitor: boolean;
    /** Parent Team Id, null if spectator */
    teamId: string | null;

    /** Open connections for the player, mapped by the id in the auth token that
     * is authorized for the connection */
    connections: Map<string, WebSocket>;

    finishedAt?: string;

    getBoardView: BoardViewProvider;

    constructor(
        room: Room,
        id: string,
        nickname: string,
        teamId: string | null,
        color: string = 'blue',
        monitor: boolean,
        getBoardView: BoardViewProvider,
        userId?: string
    ) {
        this.room = room;
        ((this.id = id), (this.nickname = nickname));
        this.teamId = teamId;
        this.color = color;
        this.monitor = monitor;
        this.userId = userId;
        this.getBoardView = getBoardView;

        this.connections = new Map<string, WebSocket>();
    }

    doesTokenMatch(token: RoomTokenPayload) {
        return token.userId === this.userId;
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
        this.connections.forEach((socket, id) => {
            if (socket === ws) {
                socketKey = id;
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
        const raceUser = this.room.raceHandler.getPlayer(this);
        return {
            id: this.id,
            nickname: this.nickname,
            color: this.color,
            raceStatus: raceUser
                ? {
                      connected: true,
                      ...raceUser,
                  }
                : { connected: false },
            monitor: this.monitor,
            showInRoom: this.showInRoom(),
        };
    }

    sendMessage(message: ServerMessage) {
        let finalMessage: ServerMessage;
        if (message.action === 'cellUpdate' && this.room.exploration) {
            if (!message.cell.revealed) {
                // currently should never happen, indicates that the room itself
                // handled obfuscation of the cell rather than the player
                //
                // this is technically an illegal state as of now, but rather
                // than throw an error and potentially kill the connection, just
                // ignore the message
                return;
            }
            finalMessage = {
                action: 'syncBoard',
                board: {
                    hidden: false,
                    board: this.getBoardView(),
                    width: this.room.board[0].length,
                    height: this.room.board.length,
                },
            };
        } else if (message.action === 'syncBoard' && this.room.exploration) {
            if (!message.board.hidden) {
                message.board.board = this.getBoardView();
            }
            finalMessage = message;
        } else if (message.action === 'connected') {
            if (!message.board.hidden) {
                message.board.board = this.getBoardView();
            }
            finalMessage = message;
        } else {
            finalMessage = message;
        }

        this.connections.forEach((socket) => {
            if (socket.readyState === OPEN) {
                socket.send(
                    JSON.stringify({
                        ...finalMessage,
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
    async joinRace() {
        return this.room.raceHandler.joinPlayer(this);
    }

    async leaveRace() {
        return this.room.raceHandler.leavePlayer(this);
    }

    async ready() {
        return this.room.raceHandler.readyPlayer(this);
    }
    async unready() {
        return this.room.raceHandler.unreadyPlayer(this);
    }
    //#endregion
}
