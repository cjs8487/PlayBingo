import { RaceStatusConnected } from '@playbingo/types';
import Player from '../../Player';

/**
 * Represents an arbitrary connection to a service that tracks racing status.
 * Provides a uniform interface for the bingo room to interact with that
 * service, regardless of the specifics of how that service may be implemented.
 *
 * This interface asserts no requirement of the data storage, format, or other
 * implementation details of the underling service that an instance of this
 * interface represents. However, it does require that if the implementation
 * represents and interface with an external service that the implementation be
 * able to translate from the internal PlayBingo representation of data in order
 * to interface with the service and vice versa. The most prominent example of
 * of this is in the translation of player identities to their race
 * counterparts, which will be different in each implementation.
 *
 * Authentication is considered to be an implementation detail of the service
 * and is not specified as part of this interface, however, implementations of
 * this interface will usually want to implement authentication as appropriate
 * within their implementation.
 *
 * This interface is an implementation of the adapter design pattern.
 */
export default interface RaceHandler {
    /**
     * Returns a unique key for the race handler
     */
    key(): 'local' | 'racetime';
    /**
     * Connects the bingo room to the race room
     *
     * @param url The base url for the race room
     */
    connect(url: string): void;

    /**
     * Disconnects the bingo room from the race room
     */
    disconnect(): void;

    /**
     * Join a player into the race room
     */
    joinPlayer(player: Player): Promise<boolean>;

    /**
     * Leave a player from the race room
     */
    leavePlayer(player: Player): Promise<boolean>;

    /**
     * Marks a player as ready in the race room
     */
    readyPlayer(player: Player): Promise<boolean>;

    /**
     * Marks a player as not ready in the race room
     */
    unreadyPlayer(player: Player): Promise<boolean>;

    /**
     * Refreshes the local cache of data
     */
    refresh(): Promise<void>;

    /**
     * Returns client side data representation of the race state for
     * the specified player.
     *
     * @param id The service id of the player
     */
    getPlayer(
        player: Player,
    ): Omit<RaceStatusConnected, 'connected'> | undefined;

    /**
     * Returns the start time of the race
     */
    getStartTime(): string | undefined;

    /**
     * Returns the end time of the race
     */
    getEndTime(): string | undefined;

    /**
     * Starts the race timer
     */
    startTimer(): void;

    /**
     * Signals to the race platform that a player has completed the bingo goal
     *
     * @param player The player that completed the goal
     */
    playerFinished(player: Player): Promise<void>;

    /**
     * Signals to the race platform that a player has no longer completed the bingo goal
     *
     * @param player The player who's completion needs to be undone
     */
    playerUnfinshed(player: Player): Promise<void>;

    /**
     * Signals to the race platform that all players have completed the bingo goal
     */
    allPlayersFinished(): Promise<void>;

    /**
     * Signals to the race platform that all players have no longer completed the bingo goal
     */
    allPlayersNotFinished(): Promise<void>;
}
