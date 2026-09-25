import { Player, ServerMessage } from '@playbingo/types';
import Room from '../Room';

/**
 * Represents a connection to the PlayBingo service, over an arbitrary
 * connection mechanism (e.g. WebSocket, HTTP, etc.).  
 */
export default abstract class Connection {
    constructor(protected readonly room: Room) {
        this.room = room;
    }

    public abstract send(message: ServerMessage): void;

    public abstract close(code?: number, reason?: string): void;
}
