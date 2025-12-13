import { RaceStatusConnected } from '@playbingo/types';
import RaceHandler from './RaceHandler';
import Player from '../../Player';

export default class LocalTimer implements RaceHandler {
    startedAt?: string;
    finishedAt?: string;

    constructor() {}

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
        };
    }

    getStartTime(): string | undefined {
        return this.startedAt;
    }

    getEndTime(): string | undefined {
        return this.finishedAt;
    }

    startTimer(): void {
        this.startedAt = new Date().toISOString();
    }

    async playerFinished(player: Player): Promise<void> {
        player.finishedAt = new Date().toISOString();
    }

    async playerUnfinshed(player: Player): Promise<void> {
        player.finishedAt = undefined;
    }

    async allPlayersFinished(): Promise<void> {
        this.finishedAt = new Date().toISOString();
    }

    async allPlayersNotFinished(): Promise<void> {
        this.finishedAt = undefined;
    }
}
