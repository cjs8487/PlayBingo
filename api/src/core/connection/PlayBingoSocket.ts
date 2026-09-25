import { Player, RoomAction, ServerMessage } from '@playbingo/types';
import { RawData, WebSocket } from 'ws';
import Room from '../Room';
import Connection from './Connection';

/**
 * The WebSocket protocol used by a PlayBingo room.
 *
 * `ws` deliberately exposes messages as strings/buffers and accepts almost
 * anything in `send`. Keeping that boundary here means the rest of the room
 * code can only send and receive protocol messages.
 */
export default class PlayBingoSocket extends Connection {
    constructor(
        room: Room,
        private readonly socket: WebSocket,
    ) {
        super(room);
    }

    get readyState() {
        return this.socket.readyState;
    }

    onMessage(handler: (action: RoomAction) => void): this {
        this.socket.on('message', (data: RawData) => {
            const message = data.toString();
            if (message === 'ping') {
                this.socket.send('pong');
                return;
            }

            handler(JSON.parse(message) as RoomAction);
        });
        return this;
    }

    onClose(handler: (code: number, reason: Buffer) => void): this {
        this.socket.on('close', handler);
        return this;
    }

    send(message: ServerMessage): void {
        this.socket.send(JSON.stringify(message));
    }

    close(code?: number, reason?: string | Buffer): void {
        this.socket.close(code, reason);
    }
}
