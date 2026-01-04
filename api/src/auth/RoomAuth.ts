import { sign, verify } from 'jsonwebtoken';
import Room from '../core/Room';
import { roomTokenSecret } from '../Environment';
import { randomUUID } from 'crypto';
import { RoomAction } from '@playbingo/types';

export type Permissions = {
    isSpectating: boolean;
    isMonitor: boolean;
};

export type RoomTokenPayload = {
    roomSlug: string;
    uuid: string;
    playerId: string;
    userId?: string;
} & Permissions;

const tokenStore: string[] = [];

export const createRoomToken = (
    room: Room,
    { isSpectating, isMonitor }: Partial<Permissions>,
    playerKey: string,
    userId?: string,
) => {
    const payload: RoomTokenPayload = {
        roomSlug: room.slug,
        uuid: randomUUID(),
        userId,
        isSpectating: !!isSpectating,
        isMonitor: !!isMonitor,
        playerId: `${userId ? 'user' : 'session'}:${playerKey}`,
    };
    const token = sign(payload, roomTokenSecret);
    tokenStore.push(token);
    return token;
};

export const invalidateToken = (token: string) => {
    tokenStore.splice(tokenStore.findIndex((t) => t === token));
};

export const verifyRoomToken = (
    token: string,
    room: string,
): RoomTokenPayload | false => {
    try {
        if (!tokenStore.includes(token)) {
            return false;
        }
        const payload = verify(token, roomTokenSecret) as RoomTokenPayload;
        if (payload.roomSlug !== room) {
            invalidateToken(token);
            return false;
        }
        return payload;
    } catch (e) {
        return false;
    }
};

type RoomActions = RoomAction['action'];

export const hasPermission = (
    action: RoomActions,
    payload: RoomTokenPayload,
) => {
    switch (action) {
        case 'mark':
            return !payload.isSpectating;
        case 'unmark':
            return !payload.isSpectating;
        case 'newCard':
            return payload.isMonitor;
        case 'changeColor':
            return !payload.isSpectating;
        case 'startTimer':
        case 'changeRaceHandler':
        case 'resetTimer':
            return payload.isMonitor;
        default:
            return true;
    }
};
