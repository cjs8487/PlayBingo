/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * An incoming websocket message from the server telling the client of a change in room state or instructing it to take an action
 */
export type ServerMessage = (
  | {
      action: "chat";
      message: ChatMessage;
    }
  | {
      action: "cellUpdate";
      row: number;
      col: number;
      cell: Cell;
    }
  | {
      action: "syncBoard";
      board: Board;
    }
  | {
      action: "connected";
      board: Board;
      chatHistory: ChatMessage[];
      nickname?: string;
      color?: string;
      roomData?: RoomData;
    }
  | {
      action: "unauthorized";
    }
  | {
      action: "disconnected";
    }
  | {
      action: "updateRoomData";
      roomData: RoomData;
    }
  | {
      action: "syncRaceData";
      players: Player[];
      racetimeConnection: RacetimeConnection;
    }
  | {
      action: "forbidden";
    }
) & {
  players?: Player[];
};
export type ChatMessage = (
  | string
  | {
      contents: string;
      color: string;
    }
)[];
export type Board = RevealedBoard | HiddenBoard;

/**
 * An incoming websocket message from the server telling the client of a change in room state or instructing it to take an action
 */
export interface Cell {
  goal: Goal;
  colors: string[];
}
/**
 * A single objective for a bingo game.
 */
export interface Goal {
  id: string;
  goal: string;
  description: string | null;
  difficulty?: number | null;
  categories?: string[];
}
export interface RevealedBoard {
  board: Cell[][];
  hidden?: false;
}
export interface HiddenBoard {
  hidden: true;
}
/**
 * Basic information about a room
 */
export interface RoomData {
  name: string;
  game: string;
  slug: string;
  gameSlug: string;
  racetimeConnection?: RacetimeConnection;
  newGenerator: boolean;
}
export interface RacetimeConnection {
  /**
   * Whether or not the game is enabled for racetime.gg integration and properly configured
   */
  gameActive?: boolean;
  /**
   * Full url to the connected racetime room. If not set, the room is not connected to a racetime room
   */
  url?: string;
  /**
   * True if there is an active websocket connection to the room
   */
  websocketConnected?: boolean;
  /**
   * Racetime room status
   */
  status?: string;
  /**
   * ISO 8601 duration string representing the amount of time between ready and start
   */
  startDelay?: string;
  /**
   * ISO 8601 date when the race started
   */
  started?: string;
  /**
   * ISO 8601 date when the race ended
   */
  ended?: string;
}
export interface Player {
  nickname: string;
  color: string;
  goalCount: number;
  racetimeStatus: RacetimeStatusDisconnected | RacetimeStatusConnected;
  spectator: boolean;
  monitor: boolean;
}
export interface RacetimeStatusDisconnected {
  connected: false;
}
export interface RacetimeStatusConnected {
  connected: true;
  /**
   * Racetime username connected to this player for the race
   */
  username: string;
  /**
   * Racetime race status
   */
  status: string;
  /**
   * Race finish time (ISO 8601 duration)
   */
  finishTime?: string;
}
