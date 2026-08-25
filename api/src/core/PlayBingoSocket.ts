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

            let action: RoomAction;
            try {
                action = JSON.parse(message) as RoomAction;
            } catch {
                this.send({ action: 'unauthorized' });
                return;
            }
            if (
                typeof action?.authToken !== 'string' ||
                typeof action.action !== 'string'
            ) {
                this.send({ action: 'unauthorized' });
                return;
            }
            handler(action);
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
    send(message: ServerMessage): void;
    close(code?: number, reason?: string | Buffer): void;
};

export { PlayBingoSocket };
