/**
 * Represents an arbitrary connection to a service that tracks racing status.
 * Provides a uniform interface for the bingo room to interact with that
 * service, regardless of the specifics of how that service may be implemented.
 *
 * The only requirement that this interface asserts is that the interface
 * exposed by the service is either a local service on PlayBingo or operates
 * via some identifier that uniquely identifies what player an action is
 * targeted at. All player level actions take that identifier as a parameter.
 * Generally, it is expected that this will be an OAuth token, but that is
 * not a requirement to satisfy this interface.
 *
 * This interface is an implementation of the adapter design pattern.
 */
export default interface RaceHandler {
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
    joinPlayer(token: string): Promise<boolean>;

    /**
     * Leave a player from the race room
     */
    leavePlayer(token: string): Promise<boolean>;

    /**
     * Marks a player as ready in the race room
     */
    readyPlayer(token: string): Promise<boolean>;

    /**
     * Marks a player as not ready in the race room
     */
    unreadyPlayer(token: string): Promise<boolean>;

    /**
     * Refreshes the local cache of data
     */
    refresh(): Promise<void>;
}
