import {
    Cell,
    ChatMessage,
    HiddenCell,
    Player as PlayerClientData,
    RevealedCell,
    ServerMessage,
} from '@playbingo/types';
import { RoomTokenPayload } from '../auth/RoomAuth';
import { computeRevealedMask, rowColToMask } from '../util/RoomUtils';
import Room from './Room';
import Connection from './connection/Connection';

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
    connections: Map<string, Connection>;

    /** Removes this player's listeners from the room while disconnected. */
    private unsubscribeFromRoom?: () => void;

    finishedAt?: string;

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

        this.connections = new Map<string, Connection>();
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
    addConnection(id: string, socket: Connection) {
        if (!this.hasConnections()) {
            this.subscribeToRoom();
        }
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
        const connection = this.connections.get(id);
        if (connection) {
            connection.close();
            this.connections.delete(id);
            if (!this.hasConnections()) {
                this.unsubscribeFromRoom?.();
                this.unsubscribeFromRoom = undefined;
            }
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
    handleSocketClose(ws: Connection) {
        let socketKey;
        this.connections.forEach((socket, id) => {
            if (socket === ws) {
                socketKey = id;
            }
        });
        if (socketKey) {
            this.connections.delete(socketKey);
            if (!this.hasConnections()) {
                this.unsubscribeFromRoom?.();
                this.unsubscribeFromRoom = undefined;
            }
            return true;
        }
        return false;
    }

    hasConnections() {
        return this.connections.size > 0;
    }

    /**
     * Routes room events through the player so messages are adapted for the
     * player before being fanned out to each of their connections.
     */
    private subscribeToRoom() {
        const onGoalMarked = (
            cell: Cell,
            row: number,
            col: number,
            _player: Player,
            timestamp: Date,
        ) => {
            this.sendMessage({
                action: 'board:cellUpdate',
                row,
                col,
                cell,
                timestamp: timestamp.toISOString(),
            });
        };
        const onGoalUnmarked = (
            cell: Cell,
            row: number,
            col: number,
            _player: Player,
            timestamp: Date,
        ) => {
            this.sendMessage({
                action: 'board:cellUpdate',
                row,
                col,
                cell,
                timestamp: timestamp.toISOString(),
            });
        };
        const onCellUpdate = (
            cell: Cell,
            row: number,
            col: number,
            timestamp: Date,
        ) => {
            this.sendMessage({
                action: 'board:cellUpdate',
                row,
                col,
                cell,
                timestamp: timestamp.toISOString(),
            });
        };
        const onBoardRegenerated = (board: RevealedCell[][]) => {
            this.sendMessage({
                action: 'syncBoard',
                board: {
                    width: board[0]?.length ?? 0,
                    height: board.length,
                    ...(this.room.hideCard
                        ? { hidden: true }
                        : { hidden: false, board }),
                },
            });
        };
        const onBoardRevealed = (player: Player) => {
            if (player !== this) {
                return;
            }
            this.sendMessage({
                action: 'syncBoard',
                board: {
                    hidden: false,
                    board: this.room.board,
                    width: this.room.board[0]?.length ?? 0,
                    height: this.room.board.length,
                },
            });
        };
        const onChatSent = (message: ChatMessage, timestamp: Date) => {
            this.sendMessage({
                action: 'chatSent',
                message,
                timestamp: timestamp.toISOString(),
                players: this.room.getPlayers(),
            });
        };
        const onSystemMessage = (message: ChatMessage, timestamp: Date) => {
            this.sendMessage({
                action: 'system:message',
                message,
                timestamp: timestamp.toISOString(),
                players: this.room.getPlayers(),
            });
        };

        const sendRoomInfoUpdate = () => {
            this.sendMessage({
                action: 'updateRoomData',
                roomData: this.room.roomData,
            });
        };

        this.room.on('board:goalMarked', onGoalMarked);
        this.room.on('board:goalUnmarked', onGoalUnmarked);
        this.room.on('board:cellUpdate', onCellUpdate);
        this.room.on('board:regenerated', onBoardRegenerated);
        this.room.on('board:revealed', onBoardRevealed);
        this.room.on('chatSent', onChatSent);
        this.room.on('system:message', onSystemMessage);
        // TODO: PROTOCOL V2 - implement discrete events for player list
        // this.room.on('players:join', onPlayersJoin);
        // this.room.on('players:leave', onPlayersLeave);

        // TODO: PROTOCOL V2 - implement discrete events for timer events
        this.room.on('player:finished', sendRoomInfoUpdate);
        this.room.on('player:unfinished', sendRoomInfoUpdate);
        this.room.on('timer:started', sendRoomInfoUpdate);
        this.room.on('timer:stopped', sendRoomInfoUpdate);
        this.room.on('timer:reset', sendRoomInfoUpdate);

        this.unsubscribeFromRoom = () => {
            this.room.off('board:goalMarked', onGoalMarked);
            this.room.off('board:goalUnmarked', onGoalUnmarked);
            this.room.off('board:cellUpdate', onCellUpdate);
            this.room.off('board:regenerated', onBoardRegenerated);
            this.room.off('board:revealed', onBoardRevealed);
            this.room.off('chatSent', onChatSent);
            this.room.off('system:message', onSystemMessage);
            this.room.off('player:finished', sendRoomInfoUpdate);
            this.room.off('player:unfinished', sendRoomInfoUpdate);
            this.room.off('timer:started', sendRoomInfoUpdate);
            this.room.off('timer:stopped', sendRoomInfoUpdate);
            this.room.off('timer:reset', sendRoomInfoUpdate);
        };
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
        if (message.action === 'board:cellUpdate' && this.room.exploration) {
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
                    board: this.obfuscateBoard(),
                    width: this.room.board[0].length,
                    height: this.room.board.length,
                },
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

        this.connections.forEach((connection) => {
            connection.send({
                ...finalMessage,
                connectedPlayer: this.toClientData(),
            });
        });
    }

    showInRoom() {
        return this.connections.size > 0;
    }

    //#region Goal Tracking
    mark(row: number, col: number) {
        const mask = rowColToMask(row, col, this.room.board[0].length);
        if ((this.markedGoals & mask) === 0n) {
            this.markedGoals |= mask;
            this.goalCount++;
            if (this.room.exploration) {
                this.exploredGoals = this.getRevealedMask();
            }
        }
    }

    unmark(row: number, col: number) {
        const mask = rowColToMask(row, col, this.room.board[0].length);
        if ((this.markedGoals & mask) !== 0n) {
            this.markedGoals &= ~mask;
            this.goalCount--;
            if (this.room.exploration) {
                this.exploredGoals = this.getRevealedMask();
            }
        }
    }

    hasMarked(row: number, col: number): boolean {
        const mask = rowColToMask(row, col, this.room.board[0].length);
        return (this.markedGoals & mask) !== 0n;
    }

    hasRevealed(row: number, col: number): boolean {
        const mask = rowColToMask(row, col, this.room.board[0].length);
        return (this.exploredGoals & mask) !== 0n;
    }

    getRevealedMask(): bigint {
        return (
            computeRevealedMask(
                this.markedGoals,
                this.room.board[0].length,
                this.room.board.length,
            ) | this.room.alwaysRevealedMask
        );
    }

    obfuscateBoard() {
        if (this.spectator) {
            this.exploredGoals = 0n;
            this.room.players.forEach((player) => {
                if (!player.spectator) {
                    this.exploredGoals |= player.getRevealedMask();
                }
            });
        } else {
            this.exploredGoals = this.getRevealedMask();
        }
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
