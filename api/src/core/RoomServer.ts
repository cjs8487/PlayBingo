import {
    Cell,
    ChatMessage,
    RevealedCell,
    RoomAction,
} from '@playbingo/types';
import { WebSocketServer } from 'ws';
import {
    createRoomToken,
    hasPermission,
    verifyRoomToken,
} from '../auth/RoomAuth';
import { roomCleanupInterval } from '../Environment';
import { logInfo, logWarn } from '../Logger';
import Room, { BoardGenerationOptions } from './Room';
import Player from './Player';
import PlayBingoSocket from './PlayBingoSocket';

export const roomWebSocketServer: WebSocketServer = new WebSocketServer({
    noServer: true,
});

export const allRooms = new Map<string, Room>();

const cleanupInterval = setInterval(() => {
    allRooms.forEach((room, key) => {
        if (room.canClose()) {
            room.close();
            allRooms.delete(key);
        }
    });
}, roomCleanupInterval);

const subscribeToRoom = (room: Room, ws: PlayBingoSocket) => {
    const onGoalMarked = (
        cell: Cell,
        row: number,
        col: number,
        player: Player,
    ) => {
        ws.send({ action: 'cellUpdate', row, col, cell });
    };

    const onGoalUnmarked = (
        cell: Cell,
        row: number,
        col: number,
        player: Player,
    ) => {
        ws.send({ action: 'cellUpdate', row, col, cell });
    };

    const onCellUpdate = (cell: Cell, row: number, col: number) => {
        ws.send({ action: 'cellUpdate', row, col, cell });
    };

    const onBoardRegenerated = (
        board: RevealedCell[][],
        options: BoardGenerationOptions,
    ) => {
        ws.send({
            action: 'syncBoard',
            board: {
                width: board[0]?.length ?? 0,
                height: board.length,
                ...(room.hideCard ? { hidden: true } : { hidden: false, board }),
            },
        });
    };

    const onBoardRevealed = (player: Player) => {
        ws.send({
            action: 'syncBoard',
            board: {
                hidden: false,
                board: room.board,
                width: room.board[0]?.length ?? 0,
                height: room.board.length,
            },
        });
    };

    const onChatSent = (message: ChatMessage) => {
        ws.send({
            action: 'chat',
            message,
            players: room.getPlayers(),
        });
    };

    const onSystemMessage = (message: ChatMessage) => {
        ws.send({
            action: 'chat',
            message,
            players: room.getPlayers(),
        });
    };

    room.on('board:goalMarked', onGoalMarked);
    room.on('board:goalUnmarked', onGoalUnmarked);
    room.on('board:cellUpdate', onCellUpdate);
    room.on('board:regenerated', onBoardRegenerated);
    room.on('board:revealed', onBoardRevealed);
    room.on('chatSent', onChatSent);
    room.on('system:message', onSystemMessage);
    // TODO: PROTOCOL V2 - implement discrete events for player list
    // room.on('players:join', onPlayersJoin);
    // room.on('players:leave', onPlayersLeave);

    return () => {
        room.off('board:goalMarked', onGoalMarked);
        room.off('board:goalUnmarked', onGoalUnmarked);
        room.off('board:cellUpdate', onCellUpdate);
        room.off('board:regenerated', onBoardRegenerated);
        room.off('board:revealed', onBoardRevealed);
        room.off('chatSent', onChatSent);
        room.off('system:message', onSystemMessage);
    };
}

roomWebSocketServer.on('connection', (socket, req) => {
    const ws = new PlayBingoSocket(socket);
    if (!req.url) {
        ws.send({ action: 'unauthorized' });
        ws.close();
        return;
    }
    const segments = req.url.split('/');
    segments.shift(); // remove leading empty segment
    const [, slug] = segments;

    // create timeout for uninitialized connections
    const timeout = setTimeout(() => {
        ws.send({ action: 'unauthorized' });
        ws.close();
    }, 60 * 1000);

    // const pingTimeout = setTimeout(
    //     () => {
    //         let found = false;
    //         allRooms.forEach((room) => {
    //             if (found) return;
    //             found = room.handleSocketClose(ws);
    //         });
    //         ws.close();
    //     },
    //     5 * 60 * 1000,
    // );

    let unsubscribe: (() => void) | undefined;

    // handlers
    ws.onMessage((action: RoomAction) => {
        const payload = verifyRoomToken(action.authToken, slug);
        if (!payload) {
            ws.send({ action: 'unauthorized' });
            return;
        }
        const room = allRooms.get(payload.roomSlug);
        if (!room) {
            ws.send({ action: 'unauthorized' });
            return;
        }
        if (action.action === 'join') {
            clearTimeout(timeout);
            ws.send(room.handleJoin(action, payload, ws));
            if (!unsubscribe) {
                unsubscribe = subscribeToRoom(room, ws);
            }
        }

        // helpers
        if (!hasPermission(action.action, payload)) {
            ws.send({ action: 'forbidden' });
            return;
        }

        switch (action.action) {
            case 'leave':
                unsubscribe?.();
                unsubscribe = undefined;
                ws.send({
                    action: room.handleLeave(action, payload, action.authToken)
                        ? 'disconnected'
                        : 'unauthorized',
                });
                ws.close();
                break;
            case 'mark':
                const markResult = room.handleMark(action, payload);
                if (markResult) {
                    ws.send(markResult);
                }
                break;
            case 'unmark':
                const unmarkResult = room.handleUnmark(action, payload);
                if (unmarkResult) {
                    ws.send(unmarkResult);
                }
                break;
            case 'chat':
                const chatResult = room.handleChat(action, payload);
                if (chatResult) {
                    ws.send(chatResult);
                }
                break;
            case 'changeColor':
                const changeColorResult = room.handleChangeColor(
                    action,
                    payload,
                );
                if (changeColorResult) {
                    ws.send(changeColorResult);
                }
                break;
            case 'newCard':
                room.handleNewCard(action);
                break;
            case 'revealCard':
                room.handleRevealCard(payload);
                break;
            case 'changeAuth':
                const newToken = createRoomToken(
                    room,
                    {
                        isSpectating: action.payload.spectate,
                        isMonitor: payload.isMonitor,
                    },
                    payload.playerId.split(':')[1],
                    payload.userId,
                );
                const player = room.players.get(payload.playerId);
                if (player) {
                    player.spectator = action.payload.spectate;
                    player.sendMessage({
                        action: 'reauthenticate',
                        authToken: newToken,
                    });
                    if (player.spectator) {
                        player.markedGoals = 0n;
                        player.goalCount = 0;
                        room.sendChat(
                            `${player.nickname} is now spectating`,
                            new Date(),
                        );
                    } else {
                        room.sendChat(
                            `${player.nickname} is now playing`,
                            new Date(),
                        );
                    }
                }
                break;
            case 'startTimer':
                room.handleStartTimer();
                break;
            case 'changeRaceHandler':
                room.handleChangeRaceHandler(action);
                break;
            case 'resetTimer':
                room.handleResetTimer();
                break;
            case 'setChatEnabled':
                room.handleSetChatEnabled(action);
                break;
        }
    });
    ws.onClose((code, reason) => {
        unsubscribe?.();
        unsubscribe = undefined;
        // cleanup
        // attempt to close the connection from the room, in case the connection
        // is closed unexpectedly without a leave message
        logInfo(
            `[ws] Socket connection closed - ${code} - ${reason.toString()}`,
        );
        let found = false;
        allRooms.forEach((room) => {
            if (found) return;
            found = room.handleSocketClose(ws);
        });
        if (!found) {
            logWarn(
                'Received a close frame for a websocket connection, but there was no matching socket associated with a room',
            );
        }
    });
});

roomWebSocketServer.on('close', () => {
    // cleanup
    clearInterval(cleanupInterval);
});
