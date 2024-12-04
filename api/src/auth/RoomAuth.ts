import { sign, verify } from 'jsonwebtoken';
import Room from '../core/Room';
import { roomTokenSecret } from '../Environment';
import { randomUUID } from 'crypto';
import { RoomAction } from '../types/RoomAction';

export type RoomTokenPayload = {
    roomSlug: string;
    uuid: string;
    isSpectating: boolean;
};

type Permissions = {
    isSpectating?: boolean;
};

const tokenStore: string[] = [];

export const createRoomToken = (room: Room, { isSpectating }: Permissions) => {
    const payload: RoomTokenPayload = {
        roomSlug: room.slug,
        uuid: randomUUID(),
        isSpectating: !!isSpectating,
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
            return !payload.isSpectating;
        case 'changeColor':
            return !payload.isSpectating;
        default:
            return true;
    }
};
