import { RoomAction, ServerMessage } from '@playbingo/types';
import { RawData, WebSocket } from 'ws';

/**
 * The WebSocket protocol used by a PlayBingo room.
 *
 * `ws` deliberately exposes messages as strings/buffers and accepts almost
 * anything in `send`. Keeping that boundary here means the rest of the room
 * code can only send and receive protocol messages.
 */
export default class PlayBingoSocket {
    constructor(private readonly socket: WebSocket) {}

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

export type PlayBingoSocketLike = {
    readyState: number;
    // This structural view also permits existing ws mocks at room-model
    // boundaries; production connections are always PlayBingoSocket.
    send(...args: any[]): void;
    close(code?: number, reason?: string | Buffer): void;
};

export { PlayBingoSocket };
