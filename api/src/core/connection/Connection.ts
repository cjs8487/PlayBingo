import { ServerMessage } from '@playbingo/types';
import type Room from '../Room';

/**
 * Represents a connection to the PlayBingo service, over an arbitrary
 * connection mechanism (e.g. WebSocket, HTTP, etc.).
 */
export default abstract class Connection {
    constructor(protected readonly room: Room) {}

    public abstract send(message: ServerMessage): void;

    public abstract close(code?: number, reason?: string): void;
}
