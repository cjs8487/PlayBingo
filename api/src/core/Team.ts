import Room from './Room';
import Player from './Player';
import { HiddenCell, RevealedCell, Team as TeamData } from '@playbingo/types';
import { computeRevealedMask, rowColToMask } from '../util/RoomUtils';

export default class Team {
    room: Room;
    /**
     * Unique id for the team
     */
    id: string;
    /**
     * The name of the team
     */
    name: string;
    /**
     * The players on the team
     */
    players: Map<string, Player>;

    /** Bitset of the goals the player has marked */
    markedGoals: bigint;
    /** The number of goals the player has marked */
    goalCount: number;
    /** Whether or not the player has completed the goal of the room */
    goalComplete: boolean;
    linesComplete: number;
    /** Bitset of goals that are revealed for the player in exploration based
     * modes */
    exploredGoals: bigint;

    constructor(room: Room, id: string, name: string) {
        this.room = room;
        ((this.id = id), (this.name = name));
        this.players = new Map<string, Player>();
        this.markedGoals = 0n;
        this.goalCount = 0;
        this.goalComplete = false;
        this.linesComplete = 0;
        this.exploredGoals = 0n;
    }

    addPlayer(player: Player) {
        this.players.set(player.id, player);
    }

    removePlayer(id: string) {
        this.players.delete(id);
    }

    destroy() {
        this.players.clear();
    }

    toClientData(): TeamData {
        return {
            id: this.id,
            name: this.name,
            players: Array.from(this.players.values()).map((player) =>
                player.toClientData(),
            ),
            goalCount: this.goalCount
        };
    }

    //#region Goal Tracking
    mark(row: number, col: number) {
        const mask = rowColToMask(row, col, this.room.board[0].length);
        if ((this.markedGoals & mask) === 0n) {
            this.markedGoals |= mask;
            this.goalCount++;
            if (this.room.exploration) {
                this.exploredGoals = this.getRevealedMask();
            }
        }
    }

    unmark(row: number, col: number) {
        const mask = rowColToMask(row, col, this.room.board[0].length);
        if ((this.markedGoals & mask) !== 0n) {
            this.markedGoals &= ~mask;
            this.goalCount--;
            if (this.room.exploration) {
                this.exploredGoals = this.getRevealedMask();
            }
        }
    }

    hasMarked(row: number, col: number): boolean {
        const mask = rowColToMask(row, col, this.room.board[0].length);
        return (this.markedGoals & mask) !== 0n;
    }

    hasRevealed(row: number, col: number): boolean {
        const mask = rowColToMask(row, col, this.room.board[0].length);
        return (this.exploredGoals & mask) !== 0n;
    }

    getRevealedMask(): bigint {
        return (
            computeRevealedMask(
                this.markedGoals,
                this.room.board[0].length,
                this.room.board.length,
            ) | this.room.alwaysRevealedMask
        );
    }

    obfuscateBoard() {
        this.exploredGoals = this.getRevealedMask();
        return this.room.board.map((row, rowIndex) =>
            row.map((cell, colIndex) =>
                this.hasRevealed(rowIndex, colIndex)
                    ? ({
                          revealed: true,
                          goal: cell.goal,
                          completedPlayers: cell.completedPlayers,
                      } as RevealedCell)
                    : ({
                          revealed: false,
                          completedPlayers: cell.completedPlayers,
                      } as HiddenCell),
            ),
        );
    }

    /**
     * Checks if this player has completed a set of goals on the board
     *
     * @param mask The bitmask containing the goals to check for
     */
    hasCompletedGoals(mask: bigint) {
        return (this.markedGoals & mask) === mask;
    }
    //#endregion
}
