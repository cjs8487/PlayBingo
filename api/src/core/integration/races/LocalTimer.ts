import { RaceStatusConnected } from '@playbingo/types';
import { RaceHandler as RaceHandlers } from '@prisma/client';
import Player from '../../Player';
import Room from '../../Room';
import RaceHandler from './RaceHandler';

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

    connect(_url: string): void {}

    disconnect(): void {}

    async joinPlayer(_player: Player): Promise<boolean> {
        return true;
    }

    async leavePlayer(_player: Player): Promise<boolean> {
        return true;
    }

    async readyPlayer(_player: Player): Promise<boolean> {
        return true;
    }

    async unreadyPlayer(_player: Player): Promise<boolean> {
        return true;
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
        this.room.emit('race:startChanged', null);
        this.room.emit('race:finishChanged', null);
        this.room.getAllPlayers().forEach((player) => {
            player.finishedAt = undefined;
            this.room.emit('race:playerChanged', player);
        });
    }

    startTimer(): void {
        const now = new Date();
        this.startedAt = now.toISOString();
        this.room.revealCardForAllPlayers();
        this.room.emit('race:startChanged', this.startedAt);
    }

    async playerFinished(player: Player): Promise<void> {
        player.finishedAt = new Date().toISOString();
        this.room.emit('race:playerChanged', player);
    }

    async playerUnfinshed(player: Player): Promise<void> {
        player.finishedAt = undefined;
        this.room.emit('race:playerChanged', player);
    }

    async allPlayersFinished(): Promise<void> {
        const now = new Date();
        this.finishedAt = now.toISOString();
        this.room.emit('race:finishChanged', this.finishedAt);
    }

    async allPlayersNotFinished(): Promise<void> {
        this.finishedAt = undefined;
        this.room.emit('race:finishChanged', null);
    }
}
