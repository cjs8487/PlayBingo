import { BingoMode, RoomActionType } from '@prisma/client';
import { prisma } from './Database';
import { JsonObject } from '@prisma/client/runtime/library';
import Player from '../core/Player';
import Room from '../core/Room';

export const createRoom = (
    slug: string,
    name: string,
    game: string,
    isPrivate: boolean,
    password: string,
    hideCard: boolean,
    bingoMode: BingoMode,
    lineCount: number = 1,
) => {
    return prisma.room.create({
        data: {
            slug,
            name,
            private: isPrivate,
            game: { connect: { id: game } },
            password,
            hideCard,
            bingoMode,
            lineCount,
        },
    });
};

const addRoomAction = (
    room: string,
    action: RoomActionType,
    payload: JsonObject,
) => {
    return prisma.roomAction.create({
        data: {
            room: { connect: { id: room } },
            action,
            payload,
        },
    });
};

export const addJoinAction = (room: string, nickname: string, color: string) =>
    addRoomAction(room, RoomActionType.JOIN, { nickname, color });

export const addLeaveAction = (room: string, nickname: string, color: string) =>
    addRoomAction(room, RoomActionType.LEAVE, { nickname, color });

export const addMarkAction = (
    room: string,
    nickname: string,
    color: string,
    row: number,
    col: number,
) => addRoomAction(room, RoomActionType.MARK, { nickname, color, row, col });

export const addUnmarkAction = (
    room: string,
    nickname: string,
    color: string,
    row: number,
    col: number,
) => addRoomAction(room, RoomActionType.UNMARK, { nickname, color, row, col });

export const addChatAction = (
    room: string,
    nickname: string,
    color: string,
    message: string,
) => addRoomAction(room, RoomActionType.CHAT, { nickname, color, message });

export const addChangeColorAction = (
    room: string,
    nickname: string,
    oldColor: string,
    newColor: string,
) =>
    addRoomAction(room, RoomActionType.CHANGECOLOR, {
        nickname,
        oldColor,
        newColor,
    });

export const setRoomBoard = async (room: string, board: string[]) => {
    await prisma.room.update({ where: { id: room }, data: { board } });
};

export const getFullRoomList = () => {
    return prisma.room.findMany({ include: { game: true } });
};

export const getAllRooms = () => {
    return prisma.room.findMany({ include: { history: true } });
};

export const getRoomFromSlug = (slug: string) => {
    return prisma.room.findUnique({
        where: { slug },
        include: { history: true, game: true, players: true },
    });
};

export const connectRoomToRacetime = (slug: string, racetimeRoom: string) => {
    return prisma.room.update({ where: { slug }, data: { racetimeRoom } });
};

export const disconnectRoomFromRacetime = (slug: string) => {
    return prisma.room.update({
        where: { slug },
        data: { racetimeRoom: null },
    });
};

export const createUpdatePlayer = async (room: string, player: Player) => {
    return prisma.player.upsert({
        where: { key_roomId: { key: player.id, roomId: room } },
        create: {
            key: player.id,
            nickname: player.nickname,
            color: player.color,
            room: { connect: { id: room } },
            user: { connect: { id: player.userId } },
            spectator: player.spectator,
            monitor: player.monitor,
        },
        update: {
            nickname: player.nickname,
            color: player.color,
            user: { connect: { id: player.userId } },
            spectator: player.spectator,
            monitor: player.monitor,
        },
    });
};
