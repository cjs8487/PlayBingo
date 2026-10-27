import { RoomAction, ServerMessage } from '@playbingo/types';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import {
    createRoomToken,
    hasPermission,
    verifyRoomToken,
} from '../auth/RoomAuth';
import { roomCleanupInterval } from '../Environment';
import { logError, logInfo, logWarn } from '../Logger';
import Room from './Room';
import metrics from '../metrics';

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

/** Count an upgrade exactly once, including handshake rejection or socket loss. */
export const handleRoomUpgrade = (
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer,
) => {
    const segments = req.url?.split('/');
    if (
        !segments ||
        segments.length < 3 ||
        segments[1] !== 'socket' ||
        !segments[2]
    ) {
        metrics.websocket.upgradeFinished('invalid_path');
        socket.destroy();
        return;
    }
    if (!allRooms.has(segments[2])) {
        metrics.websocket.upgradeFinished('room_missing');
        socket.destroy();
        return;
    }
    let finished = false;
    const finish = (result: 'accepted' | 'handshake_failed') => {
        if (finished) return;
        finished = true;
        socket.off('close', failed);
        socket.off('error', failed);
        metrics.websocket.upgradeFinished(result);
    };
    const failed = () => finish('handshake_failed');
    socket.once('close', failed);
    socket.once('error', failed);
    try {
        roomWebSocketServer.handleUpgrade(req, socket, head, (ws) => {
            finish('accepted');
            roomWebSocketServer.emit('connection', ws, req);
        });
    } catch (error) {
        failed();
        socket.destroy();
        logError(`WebSocket upgrade failed: ${error}`);
    }
};

roomWebSocketServer.on('connection', (ws, req) => {
    const finishInitialization = metrics.websocket.initializationStarted();
    const stopConnectionTimer = metrics.websocket.websocketOpened();
    let initializationFinished = false;
    const finishJoin = (
        result: 'joined' | 'timeout' | 'closed_before_join',
    ) => {
        if (initializationFinished) return;
        initializationFinished = true;
        finishInitialization(result);
        clearTimeout(timeout);
    };
    const sendWsMessage = (message: ServerMessage | 'pong') => {
        const messageType =
            typeof message === 'string' ? message : message.action;
        metrics.websocket.messageSent(messageType);
        try {
            ws.send(
                typeof message === 'string' ? message : JSON.stringify(message),
                (error) => {
                    if (error) metrics.websocket.messageSendFailed(messageType);
                },
            );
        } catch (error) {
            metrics.websocket.messageSendFailed(messageType);
            throw error;
        }
    };
    const timeout = setTimeout(() => {
        finishJoin('timeout');
        sendWsMessage({ action: 'unauthorized' });
        ws.close();
    }, 60 * 1000);
    ws.once('close', (code) => {
        finishJoin('closed_before_join');
        metrics.websocket.websocketClosed(code, stopConnectionTimer);
    });

    const slug = req.url?.split('/')[2];
    if (!slug || !allRooms.has(slug)) {
        sendWsMessage({ action: 'unauthorized' });
        ws.close();
        return;
    }

    // handlers
    ws.on('message', (message) => {
        const messageString = message.toString();
        if (messageString === 'ping') {
            const stop = metrics.websocket.messageReceived('ping');
            let result: 'processed' | 'error' = 'processed';
            try {
                sendWsMessage('pong');
            } catch (error) {
                result = 'error';
                throw error;
            } finally {
                stop();
                metrics.websocket.actionFinished('ping', result);
            }
            return;
        }
        const action: RoomAction = JSON.parse(messageString);
        const stop = metrics.websocket.messageReceived(action.action);
        let result: 'processed' | 'unauthorized' | 'forbidden' | 'error' =
            'processed';
        try {
            const payload = verifyRoomToken(action.authToken, slug);
            if (!payload) {
                result = 'unauthorized';
                sendWsMessage({ action: 'unauthorized' });
                return;
            }
            const room = allRooms.get(payload.roomSlug);
            if (!room) {
                result = 'unauthorized';
                sendWsMessage({ action: 'unauthorized' });
                return;
            }
            if (action.action === 'join') {
                const response = room.handleJoin(action, payload, ws);
                if (response.action === 'connected') finishJoin('joined');
                else result = 'unauthorized';
                sendWsMessage(response);
            }
            if (!hasPermission(action.action, payload)) {
                result = 'forbidden';
                sendWsMessage({ action: 'forbidden' });
                return;
            }
            switch (action.action) {
                case 'leave':
                    const leaveResult = room.handleLeave(
                        action,
                        payload,
                        action.authToken,
                    );
                    if (
                        leaveResult.action === 'unauthorized' ||
                        leaveResult.action === 'forbidden'
                    ) {
                        result = leaveResult.action;
                    }
                    sendWsMessage(leaveResult);
                    ws.close();
                    break;
                case 'mark':
                    const markResult = room.handleMark(action, payload);
                    if (markResult) {
                        if (
                            markResult.action === 'unauthorized' ||
                            markResult.action === 'forbidden'
                        ) {
                            result = markResult.action;
                        }
                        sendWsMessage(markResult);
                    }
                    break;
                case 'unmark':
                    const unmarkResult = room.handleUnmark(action, payload);
                    if (unmarkResult) {
                        if (
                            unmarkResult.action === 'unauthorized' ||
                            unmarkResult.action === 'forbidden'
                        ) {
                            result = unmarkResult.action;
                        }
                        sendWsMessage(unmarkResult);
                    }
                    break;
                case 'chat':
                    const chatResult = room.handleChat(action, payload);
                    if (chatResult) {
                        if (
                            chatResult.action === 'unauthorized' ||
                            chatResult.action === 'forbidden'
                        ) {
                            result = chatResult.action;
                        }
                        sendWsMessage(chatResult);
                    }
                    break;
                case 'changeColor':
                    const changeColorResult = room.handleChangeColor(
                        action,
                        payload,
                    );
                    if (changeColorResult) {
                        if (
                            changeColorResult.action === 'unauthorized' ||
                            changeColorResult.action === 'forbidden'
                        ) {
                            result = changeColorResult.action;
                        }
                        sendWsMessage(changeColorResult);
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
        } catch (error) {
            result = 'error';
            throw error;
        } finally {
            stop();
            metrics.websocket.actionFinished(action.action, result);
        }
    });
    ws.on('close', (code, reason) => {
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
