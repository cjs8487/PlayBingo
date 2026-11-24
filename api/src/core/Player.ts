import {
    Cell,
    HiddenCell,
    Player as PlayerClientData,
    RevealedCell,
    RoomAnnouncement,
    ServerMessage,
} from '@playbingo/types';
import { RoomTokenPayload } from '../auth/RoomAuth';
import Connection from './connection/Connection';
import Room, { RoomEvents } from './Room';

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
    userId?: string;
    /** If the player has permission to perform monitor actions in the room */
    monitor: boolean;
    /** Parent Team Id, undefined if spectator */
    teamId?: string;

    /** Open connections for the player, mapped by the id in the auth token that
     * is authorized for the connection */
    connections: Map<string, Connection>;

    private unsubscribeFromRoom?: () => void;

    finishedAt?: string;
    /** Whether the card is hidden for this player. */
    boardHidden: boolean;

    constructor(
        room: Room,
        id: string,
        nickname: string,
        monitor: boolean,
        teamId?: string,
        userId?: string,
    ) {
        this.room = room;
        this.id = id;
        this.nickname = nickname;
        this.teamId = teamId;
        this.monitor = monitor;
        this.boardHidden = room.hideCard;
        this.userId = userId;

        this.connections = new Map<string, Connection>();
    }

    /**
     * The board as this player is allowed to see it. Resolved from the player's
     * current team so that it stays correct when they change teams or toggle
     * between playing and spectating.
     */
    getBoardView(): (RevealedCell | HiddenCell)[][] {
        const team = this.teamId ? this.room.teams.get(this.teamId) : undefined;
        return team
            ? team.obfuscateBoard()
            : this.room.spectatorObfuscateBoard();
    }

    /**
     * The name to attribute an action by this player to. When teams are enabled
     * the player is qualified with their team so that the individual
     * responsible for the action is never lost.
     */
    getDisplayName(): string {
        const team = this.teamId ? this.room.teams.get(this.teamId) : undefined;
        return this.room.teamsEnabled && team
            ? `${this.nickname} (${team.name})`
            : this.nickname;
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
        const previous = this.connections.get(id);
        this.connections.set(id, socket);
        if (previous !== socket) previous?.close();
    }

    /** Removes a connection so the transport can send its leave response before closing. */
    removeConnection(id: string) {
        const removed = this.connections.delete(id);
        if (removed && !this.hasConnections()) {
            this.unsubscribeFromRoom?.();
            this.unsubscribeFromRoom = undefined;
        }
        return removed;
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
            return this.removeConnection(socketKey);
        }
        return false;
    }

    hasConnections() {
        return this.connections.size > 0;
    }

    private subscribeToRoom() {
        const room = this.room;
        const onCellUpdate = (
            cell: Cell,
            row: number,
            col: number,
            timestamp: Date,
        ) => {
            if (!this.boardHidden) {
                this.sendMessage({
                    action: 'board:cellUpdate',
                    timestamp: timestamp.toISOString(),
                    row,
                    col,
                    cell,
                    players: room.getPlayerData(),
                });
            }
        };
        const onGoalChange: RoomEvents['board:goalMarked'] = (
            cell,
            row,
            col,
            _player,
            timestamp,
        ) => {
            onCellUpdate(cell, row, col, timestamp);
        };
        const syncBoard = () => {
            this.sendMessage({
                action: 'syncBoard',
                board: {
                    width: room.boardWidth,
                    height: room.boardHeight,
                    ...(this.boardHidden
                        ? { hidden: true }
                        : { hidden: false, board: room.board }),
                },
                players: room.getPlayerData(),
            });
        };
        const onBoardRegenerated = syncBoard;
        const onBoardRevealed = (revealedPlayer: Player) => {
            if (revealedPlayer === this) syncBoard();
        };
        const onAnnouncement = (
            announcement: RoomAnnouncement,
            exclude?: Player,
        ) => {
            if (exclude === this) return;
            this.sendMessage({
                ...this.visibleAnnouncement(announcement),
                players: room.getPlayerData(),
            });
        };
        const sendRoomInfoUpdate = () => {
            this.sendMessage({
                action: 'updateRoomData',
                roomData: room.roomData,
            });
        };
        room.on('board:goalMarked', onGoalChange);
        room.on('board:goalUnmarked', onGoalChange);
        room.on('board:cellUpdate', onCellUpdate);
        room.on('board:regenerated', onBoardRegenerated);
        room.on('board:revealed', onBoardRevealed);
        room.on('chat:announcement', onAnnouncement);

        // TODO: PROTOCOL V2 - implement discrete events for timer events
        room.on('team:finished', sendRoomInfoUpdate);
        room.on('team:unfinished', sendRoomInfoUpdate);
        room.on('timer:started', sendRoomInfoUpdate);
        room.on('timer:stopped', sendRoomInfoUpdate);
        room.on('timer:reset', sendRoomInfoUpdate);

        this.unsubscribeFromRoom = () => {
            room.off('board:goalMarked', onGoalChange);
            room.off('board:goalUnmarked', onGoalChange);
            room.off('board:cellUpdate', onCellUpdate);
            room.off('board:regenerated', onBoardRegenerated);
            room.off('board:revealed', onBoardRevealed);
            room.off('chat:announcement', onAnnouncement);
            room.off('team:finished', sendRoomInfoUpdate);
            room.off('team:unfinished', sendRoomInfoUpdate);
            room.off('timer:started', sendRoomInfoUpdate);
            room.off('timer:stopped', sendRoomInfoUpdate);
            room.off('timer:reset', sendRoomInfoUpdate);
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
            teamId: this.teamId,
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

    visibleAnnouncement(
        announcement: RoomAnnouncement,
        board?: Cell[][],
    ): RoomAnnouncement {
        if (
            announcement.action !== 'board:goalMarked' &&
            announcement.action !== 'board:goalUnmarked'
        ) {
            return announcement;
        }
        if (!this.boardHidden) {
            if (!this.room.exploration) return announcement;
            const cell = (board ?? this.getBoardView())[announcement.row]?.[
                announcement.col
            ];
            if (cell?.revealed && cell.goal.goal === announcement.goal)
                return announcement;
        }
        return { ...announcement, goal: undefined };
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
                players: message.players,
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

        if (
            finalMessage.action === 'syncBoard' ||
            finalMessage.action === 'connected'
        ) {
            this.boardHidden = !!finalMessage.board.hidden;
        }

        this.connections.forEach((connection) => {
            connection.send({
                ...finalMessage,
                connectedPlayer: this.toClientData(),
            });
        });
    }

    /** Sends the current membership's board view to all of this player's connections. */
    syncBoard() {
        this.sendMessage({
            action: 'syncBoard',
            board: {
                width: this.room.board[0].length,
                height: this.room.board.length,
                ...(this.boardHidden
                    ? { hidden: true }
                    : { hidden: false, board: this.room.board }),
            },
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
