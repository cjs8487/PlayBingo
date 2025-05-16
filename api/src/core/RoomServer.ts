import { RoomAction } from '@playbingo/types';
import { WebSocketServer } from 'ws';
import { hasPermission, verifyRoomToken } from '../auth/RoomAuth';
import Room from './Room';
import { logInfo } from '../Logger';

export const roomWebSocketServer: WebSocketServer = new WebSocketServer({
    noServer: true,
});

export const allRooms = new Map<string, Room>();

roomWebSocketServer.on('connection', (ws, req) => {
    if (!req.url) {
        ws.send(JSON.stringify({ action: 'unauthorized' }));
        ws.close();
        return;
    }
    const segments = req.url.split('/');
    segments.shift(); // remove leading empty segment
    const [, slug] = segments;

    // create timeout for uninitialized connections
    const timeout = setTimeout(() => {
        ws.send(JSON.stringify({ action: 'unauthorized' }));
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

    // handlers
    ws.on('message', (message) => {
        const messageString = message.toString();

        if (messageString === 'ping') {
            ws.send('pong');
            // pingTimeout.refresh();
            return;
        }

        const action: RoomAction = JSON.parse(messageString);
        const payload = verifyRoomToken(action.authToken, slug);
        if (!payload) {
            ws.send(JSON.stringify({ action: 'unauthorized' }));
            return;
        }
        const room = allRooms.get(payload.roomSlug);
        if (!room) {
            ws.send(JSON.stringify({ action: 'unauthorized' }));
            return;
        }
        if (action.action === 'join') {
            clearTimeout(timeout);
            ws.send(JSON.stringify(room.handleJoin(action, payload, ws)));
        }

        // helpers
        if (!hasPermission(action.action, payload)) {
            return ws.send(JSON.stringify({ action: 'forbidden' }));
        }

        switch (action.action) {
            case 'leave':
                ws.send(
                    JSON.stringify(
                        room.handleLeave(action, payload, action.authToken),
                    ),
                );
                ws.close();
                break;
            case 'mark':
                const markResult = room.handleMark(action, payload);
                if (markResult) {
                    ws.send(JSON.stringify(markResult));
                }
                break;
            case 'unmark':
                const unmarkResult = room.handleUnmark(action, payload);
                if (unmarkResult) {
                    ws.send(JSON.stringify(unmarkResult));
                }
                break;
            case 'chat':
                const chatResult = room.handleChat(action, payload);
                if (chatResult) {
                    ws.send(JSON.stringify(chatResult));
                }
                break;
            case 'changeColor':
                const changeColorResult = room.handleChangeColor(
                    action,
                    payload,
                );
                if (changeColorResult) {
                    ws.send(JSON.stringify(changeColorResult));
                }
                break;
            case 'newCard':
                room.handleNewCard(action);
                break;
            case 'revealCard':
                const board = room.handleRevealCard(payload);
                if (board) {
                    ws.send(JSON.stringify({ action: 'syncBoard', board }));
                }
                break;
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
    });
});
roomWebSocketServer.on('close', () => {
    // cleanup
});
