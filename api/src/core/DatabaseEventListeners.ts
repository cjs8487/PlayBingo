import { ChatMessage } from '@playbingo/types';
import {
    addChatAction,
    addJoinAction,
    addLeaveAction,
    addMarkAction,
    addUnmarkAction,
    createUpdatePlayer,
    setRoomBoard,
} from '../database/Rooms';
import Player from './Player';
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
        // Listen for player join events
        room.on('players:join', async (player: Player) => {
            await addJoinAction(room.id, player.nickname, player.color);
            await createUpdatePlayer(room.id, player);
        });

        // Listen for player leave events
        room.on('players:leave', async (player: Player) => {
            await addLeaveAction(room.id, player.nickname, player.color);
        });

        // Listen for chat events
        room.on('chatSent', async (chatMessage: ChatMessage) => {
            await this.handleChatEvent(chatMessage, room);
        });

        // Listen for player color change events
        room.on('player:colorChanged', async (player: Player) => {
            await createUpdatePlayer(room.id, player);
        });

        // Listen for board events
        room.on('board:goalMarked', async (cell, row, col, player) => {
            await addMarkAction(room.id, player.id, row, col);
        });

        room.on('board:goalUnmarked', async (cell, row, col, player) => {
            await addUnmarkAction(room.id, player.id, row, col);
        });

        room.on('board:regenerated', async (board, options) => {
            if (board && board.length > 0) {
                await setRoomBoard(
                    room.id,
                    board.flat().map((cell) => cell.goal.id),
                );
            }
        });
    }

    private removeEventListeners(room: Room): void {
        // Remove all event listeners for this room
        room.removeAllListeners('players:join');
        room.removeAllListeners('players:leave');
        room.removeAllListeners('chatSent');
        room.removeAllListeners('player:colorChanged');
        room.removeAllListeners('board:goalMarked');
        room.removeAllListeners('board:goalUnmarked');
        room.removeAllListeners('board:regenerated');
    }

    private async handleChatEvent(
        chatMessage: ChatMessage,
        room: Room,
    ): Promise<void> {
        // Extract player info from chat message if possible
        if (Array.isArray(chatMessage) && chatMessage.length > 0) {
            const firstElement = chatMessage[0];
            if (
                typeof firstElement === 'object' &&
                'contents' in firstElement
            ) {
                // This is a formatted chat message with player info
                const messageText = chatMessage
                    .map((part) =>
                        typeof part === 'string' ? part : part.contents,
                    )
                    .join('');

                // Extract nickname and color from the message
                const match = messageText.match(/^([^:]+): (.+)$/);
                if (match) {
                    const [, nickname, message] = match;
                    const player = Array.from(room.players.values()).find(
                        (p) => p.nickname === nickname,
                    );
                    if (player) {
                        await addChatAction(
                            room.id,
                            player.nickname,
                            player.color,
                            message,
                        );
                    }
                }
            }
        }
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
