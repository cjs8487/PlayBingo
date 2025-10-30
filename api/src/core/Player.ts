import {
    HiddenCell,
    Player as PlayerClientData,
    RevealedCell,
    ServerMessage,
} from '@playbingo/types';
import { OPEN, WebSocket } from 'ws';
import { RoomTokenPayload } from '../auth/RoomAuth';
import { getAccessToken } from '../lib/RacetimeConnector';
import RaceHandler from './integration/races/RaceHandler';
import Room from './Room';
import {
    computeRevealedMask,
    rowColToBitIndex,
    rowColToMask,
} from '../util/RoomUtils';

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

    /** Bitset of the goals the player has marked */
    markedGoals: bigint;
    /** The number of goals the player has marked */
    goalCount: number;
    /** Whether or not the player has completed the goal of the room */
    goalComplete: boolean;
    linesComplete: number;
    /** Bitset of goals that are revealed for the player in exploration based
     * modes */
    exploredGoals: bigint;

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
        ((this.id = id), (this.nickname = nickname));
        this.color = color;
        this.spectator = spectator;
        this.monitor = monitor;
        this.userId = userId;

        this.markedGoals = 0n;
        this.goalCount = 0;
        this.goalComplete = false;
        this.linesComplete = 0;
        this.exploredGoals = 0n;

        this.connections = new Map<string, WebSocket>();

        this.raceHandler = room.raceHandler;
        this.raceId = '';
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
                board: { hidden: false, board: this.obfuscateBoard() },
            };
        } else if (message.action === 'syncBoard' && this.room.exploration) {
            if (!message.board.hidden) {
                message.board.board = this.obfuscateBoard();
            }
            finalMessage = message;
        } else if (message.action === 'connected') {
            if (!message.board.hidden) {
                message.board.board = this.obfuscateBoard();
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

    //#region Goal Tracking
    mark(row: number, col: number) {
        const mask = rowColToMask(row, col, 5);
        if ((this.markedGoals & mask) === 0n) {
            this.markedGoals |= mask;
            this.goalCount++;
            if (this.room.exploration) {
                this.exploredGoals = this.getRevealedMask();
            }
        }
    }

    unmark(row: number, col: number) {
        const mask = rowColToMask(row, col, 5);
        if ((this.markedGoals & mask) !== 0n) {
            this.markedGoals &= ~mask;
            this.goalCount--;
            if (this.room.exploration) {
                this.exploredGoals = this.getRevealedMask();
            }
        }
    }

    hasMarked(row: number, col: number): boolean {
        const mask = rowColToMask(row, col, 5);
        return (this.markedGoals & mask) !== 0n;
    }

    hasRevealed(row: number, col: number): boolean {
        const mask = rowColToMask(row, col, 5);
        return (this.exploredGoals & mask) !== 0n;
    }

    getRevealedMask(): bigint {
        return computeRevealedMask(this.markedGoals, 5, 5) | 1n;
    }

    obfuscateBoard() {
        return this.room.board.map((row, rowIndex) =>
            row.map((cell, colIndex) =>
                this.hasRevealed(rowIndex, colIndex)
                    ? ({
                          revealed: true,
                          goal: cell.goal,
                          completedPlayers: cell.completedPlayers,
                      } as RevealedCell)
                    : ({
                          revealed: false,
                          completedPlayers: cell.completedPlayers,
                      } as HiddenCell),
            ),
        );
    }

    /**
     * Checks if this player has completed a set of goals on the board
     *
     * @param mask The bitmask containing the goals to check for
     */
    hasCompletedGoals(mask: bigint) {
        return (this.markedGoals & mask) === mask;
    }
    //#endregion

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
