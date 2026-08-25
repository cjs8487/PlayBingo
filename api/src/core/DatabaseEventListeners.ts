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
 * Handles database operations in response to Room events.
 */
const roomListeners: Map<string, Room> = new Map();

/**
 * Subscribe a room to database event listeners
 */
export function subscribe(room: Room): void {
    if (roomListeners.has(room.id)) {
        return; // Already subscribed
    }

    roomListeners.set(room.id, room);
    setupEventListeners(room);
}

/**
 * Unsubscribe a room from database event listeners
 */
export function unsubscribe(roomId: string): void {
    const room = roomListeners.get(roomId);
    if (room) {
        removeEventListeners(room);
        roomListeners.delete(roomId);
    }
}

function setupEventListeners(room: Room): void {
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
        await handleChatEvent(chatMessage, room);
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

function removeEventListeners(room: Room): void {
    // Remove all event listeners for this room
    room.removeAllListeners('players:join');
    room.removeAllListeners('players:leave');
    room.removeAllListeners('chatSent');
    room.removeAllListeners('player:colorChanged');
    room.removeAllListeners('board:goalMarked');
    room.removeAllListeners('board:goalUnmarked');
    room.removeAllListeners('board:regenerated');
}

async function handleChatEvent(
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
export function getSubscribedRooms(): string[] {
    return Array.from(roomListeners.keys());
}

/**
 * Check if a room is currently subscribed
 */
export function isSubscribed(roomId: string): boolean {
    return roomListeners.has(roomId);
}
