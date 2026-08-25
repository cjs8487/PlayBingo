import {
    addChatAction,
    addJoinAction,
    addLeaveAction,
    addMarkAction,
    addUnmarkAction,
    setRoomBoard,
} from '../database/Rooms';
import type Room from './Room';
import type { RoomEvents } from './Room';

const roomListeners = new Map<string, () => void>();

export function subscribe(room: Room): void {
    if (roomListeners.has(room.id)) {
        return;
    }

    const onClose = () => unsubscribe(room.id);
    const onPlayerConnected: RoomEvents['player:connected'] = (
        player,
        timestamp,
    ) => {
        persistAction(
            room,
            addJoinAction(
                room.id,
                player.id,
                player.nickname,
                player.teamId,
                timestamp,
            ),
        );
    };
    const onPlayersLeave: RoomEvents['players:leave'] = (player, timestamp) => {
        persistAction(
            room,
            addLeaveAction(
                room.id,
                player.id,
                player.nickname,
                player.teamId,
                timestamp,
            ),
        );
    };
    const onPlayerChat: RoomEvents['player:chat'] = (
        player,
        message,
        timestamp,
    ) => {
        persistAction(
            room,
            addChatAction(
                room.id,
                player.id,
                player.nickname,
                message,
                timestamp,
            ),
        );
    };
    const onBoardGoalMarked: RoomEvents['board:goalMarked'] = (
        _cell,
        row,
        col,
        player,
        timestamp,
    ) => {
        if (player.teamId) {
            persistAction(
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
    };
    const onBoardGoalUnmarked: RoomEvents['board:goalUnmarked'] = (
        _cell,
        row,
        col,
        player,
        timestamp,
    ) => {
        if (player.teamId) {
            persistAction(
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
    };
    const onBoardRegenerated: RoomEvents['board:regenerated'] = (
        board,
        _options,
        persist,
    ) => {
        persist?.(
            setRoomBoard(
                room.id,
                board.flat().map((cell) => cell.goal.id),
                room.boardWidth,
                room.boardHeight,
            ),
        );
    };
    room.on('player:connected', onPlayerConnected);
    room.on('players:leave', onPlayersLeave);
    room.on('player:chat', onPlayerChat);
    room.on('board:goalMarked', onBoardGoalMarked);
    room.on('board:goalUnmarked', onBoardGoalUnmarked);
    room.on('board:regenerated', onBoardRegenerated);
    room.once('room:closed', onClose);
    roomListeners.set(room.id, () => {
        room.off('player:connected', onPlayerConnected);
        room.off('players:leave', onPlayersLeave);
        room.off('player:chat', onPlayerChat);
        room.off('board:goalMarked', onBoardGoalMarked);
        room.off('board:goalUnmarked', onBoardGoalUnmarked);
        room.off('board:regenerated', onBoardRegenerated);
        room.off('room:closed', onClose);
    });
}

export function unsubscribe(roomId: string): void {
    roomListeners.get(roomId)?.();
    roomListeners.delete(roomId);
}

function persistAction(room: Room, operation: Promise<unknown>) {
    operation.catch((error) =>
        room.logError(`Failed to persist room event - ${error}`),
    );
}

export function getSubscribedRooms(): string[] {
    return Array.from(roomListeners.keys());
}

export function isSubscribed(roomId: string): boolean {
    return roomListeners.has(roomId);
}
