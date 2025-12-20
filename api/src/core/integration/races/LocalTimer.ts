import { RaceStatusConnected } from '@playbingo/types';
import RaceHandler from './RaceHandler';
import Player from '../../Player';
import Room from '../../Room';
import {
    createUpdatePlayer,
    updateFinishTime,
    updateStartTime,
} from '../../../database/Rooms';
import { RaceHandler as RaceHandlers } from '@prisma/client';

export default class LocalTimer implements RaceHandler {
    startedAt?: string;
    finishedAt?: string;
    room: Room;

    constructor(room: Room) {
        this.room = room;
    }

    key() {
        return RaceHandlers.LOCAL;
    }

    connect(url: string): void {}

    disconnect(): void {}

    async joinPlayer(player: Player): Promise<boolean> {
        return true;
    }

    async leavePlayer(player: Player): Promise<boolean> {
        return true;
    }

    async readyPlayer(player: Player): Promise<boolean> {
        return true;
    }

    async unreadyPlayer(player: Player): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    async refresh(): Promise<void> {}

    getPlayer(
        player: Player,
    ): Omit<RaceStatusConnected, 'connected'> | undefined {
        return {
            username: player.id,
            finishTime: player.finishedAt,
        };
    }

    getStartTime(): string | undefined {
        return this.startedAt;
    }

    getEndTime(): string | undefined {
        return this.finishedAt;
    }

    resetTimer(): void {
        this.startedAt = undefined;
        this.finishedAt = undefined;
        updateStartTime(this.room.id, null).then();
        updateFinishTime(this.room.id, null).then();
        this.room.players.forEach((player) => {
            player.finishedAt = undefined;
            createUpdatePlayer(this.room.id, player).then();
        });
    }

    startTimer(): void {
        this.startedAt = new Date().toISOString();
        this.room.revealCardForAllPlayers();
        updateStartTime(this.room.id, new Date()).then();
    }

    async playerFinished(player: Player): Promise<void> {
        player.finishedAt = new Date().toISOString();
        createUpdatePlayer(this.room.id, player).then();
    }

    async playerUnfinshed(player: Player): Promise<void> {
        player.finishedAt = undefined;
        createUpdatePlayer(this.room.id, player).then();
    }

    async allPlayersFinished(): Promise<void> {
        const now = new Date();
        this.finishedAt = now.toISOString();
        updateFinishTime(this.room.id, now).then();
    }

    async allPlayersNotFinished(): Promise<void> {
        this.finishedAt = undefined;
        updateFinishTime(this.room.id, null).then();
    }
}
