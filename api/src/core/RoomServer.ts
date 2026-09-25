import { RoomAction } from '@playbingo/types';
import { WebSocketServer } from 'ws';
import {
    createRoomToken,
    hasPermission,
    verifyRoomToken,
} from '../auth/RoomAuth';
import { roomCleanupInterval } from '../Environment';
import { logInfo, logWarn } from '../Logger';
import Room from './Room';
import PlayBingoSocket from './connection/PlayBingoSocket';

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

roomWebSocketServer.on('connection', (socket, req) => {
    if (!req.url) {
        socket.close(4000, 'Bad Request');
        return;
    }
    const segments = req.url.split('/');
    segments.shift(); // remove leading empty segment
    const [, slug] = segments;

    const room = allRooms.get(slug);
    if (!room) {
        socket.close(4001, 'Unknown room');
        return;
    }

    // create timeout for uninitialized connections
    const timeout = setTimeout(() => {
        ws.send({ action: 'unauthorized' });
        ws.close();
    }, 60 * 1000);
    const ws = new PlayBingoSocket(room, socket);

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
        }

        // helpers
        if (!hasPermission(action.action, payload)) {
            ws.send({ action: 'forbidden' });
            return;
        }

        switch (action.action) {
            case 'leave':
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
