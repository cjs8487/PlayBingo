import { RaceStatusConnected } from '@playbingo/types';
import RaceHandler from './RaceHandler';
import Player from '../../Player';

export default class LocalTimer implements RaceHandler {
    startedAt?: string;
    finishedAt?: string;

    constructor() {}

    connect(url: string): void {}

    disconnect(): void {}

    async joinPlayer(token: string): Promise<boolean> {
        return true;
    }

    async leavePlayer(token: string): Promise<boolean> {
        return true;
    }

    async readyPlayer(token: string): Promise<boolean> {
        return true;
    }

    async unreadyPlayer(token: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    async refresh(): Promise<void> {}

    getPlayer(id: string): Omit<RaceStatusConnected, 'connected'> | undefined {
        return {
            username: id,
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
