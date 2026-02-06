import {
    addChatAction,
    addJoinAction,
    addLeaveAction,
    addMarkAction,
    addUnmarkAction,
    setRoomBoard,
} from '../database/Rooms';
import Room from './Room';

/**
 * Singleton class that handles database operations in response to Room events
 */
export class DatabaseEventListeners {
    private static instance: DatabaseEventListeners;
    private roomListeners: Map<string, Room> = new Map();

    private constructor() {}

    static getInstance(): DatabaseEventListeners {
        if (!DatabaseEventListeners.instance) {
            DatabaseEventListeners.instance = new DatabaseEventListeners();
        }
        return DatabaseEventListeners.instance;
    }

    /**
     * Subscribe a room to database event listeners
     */
    subscribe(room: Room): void {
        if (this.roomListeners.has(room.id)) {
            return; // Already subscribed
        }

        this.roomListeners.set(room.id, room);
        this.setupEventListeners(room);
    }

    /**
     * Unsubscribe a room from database event listeners
     */
    unsubscribe(roomId: string): void {
        const room = this.roomListeners.get(roomId);
        if (room) {
            this.removeEventListeners(room);
            this.roomListeners.delete(roomId);
        }
    }

    private setupEventListeners(room: Room): void {
        room.on('player:connected', (player, timestamp) => {
            this.persist(
                room,
                addJoinAction(
                    room.id,
                    player.id,
                    player.nickname,
                    player.teamId,
                    timestamp,
                ),
            );
        });
        room.on('players:leave', (player, timestamp) => {
            this.persist(
                room,
                addLeaveAction(
                    room.id,
                    player.id,
                    player.nickname,
                    player.teamId,
                    timestamp,
                ),
            );
        });
        room.on('player:chat', (player, message, timestamp) => {
            this.persist(
                room,
                addChatAction(
                    room.id,
                    player.id,
                    player.nickname,
                    message,
                    timestamp,
                ),
            );
        });
        room.on('board:goalMarked', (_cell, row, col, player, timestamp) => {
            if (player.teamId) {
                this.persist(
                    room,
                    addMarkAction(
                        room.id,
                        player.id,
                        player.teamId,
                        row,
                        col,
                        timestamp,
                    ),
                );
            }
        });
        room.on('board:goalUnmarked', (_cell, row, col, player, timestamp) => {
            if (player.teamId) {
                this.persist(
                    room,
                    addUnmarkAction(
                        room.id,
                        player.id,
                        player.teamId,
                        row,
                        col,
                        timestamp,
                    ),
                );
            }
        });
        room.on('board:regenerated', (board, _options, persist) => {
            persist?.(
                setRoomBoard(
                    room.id,
                    board.flat().map((cell) => cell.goal.id),
                    room.boardWidth,
                    room.boardHeight,
                ),
            );
        });
    }

    private persist(room: Room, operation: Promise<unknown>) {
        operation.catch((error) =>
            room.logError(`Failed to persist room event - ${error}`),
        );
    }

    private removeEventListeners(room: Room): void {
        room.removeAllListeners('player:connected');
        room.removeAllListeners('players:leave');
        room.removeAllListeners('player:chat');
        room.removeAllListeners('board:goalMarked');
        room.removeAllListeners('board:goalUnmarked');
        room.removeAllListeners('board:regenerated');
    }

    /**
     * Get the list of currently subscribed rooms
     */
    getSubscribedRooms(): string[] {
        return Array.from(this.roomListeners.keys());
    }

    /**
     * Check if a room is currently subscribed
     */
    isSubscribed(roomId: string): boolean {
        return this.roomListeners.has(roomId);
    }
}
