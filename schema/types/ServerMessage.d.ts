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

/**
 * An incoming websocket message from the server telling the client of a change in room state or instructing it to take an action
 */
export interface Cell {
  goal: string;
  description: string;
  colors: string[];
}
/**
 * An incoming websocket message from the server telling the client of a change in room state or instructing it to take an action
 */
export interface Board {
  board: Cell[][];
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
}
export interface RacetimeConnection {
  /**
   * Whether or not the game is enabled for racetime.gg integration and properly configured
   */
  gameActive?: boolean;
  /**
   * Racetime game slug
   */
  slug?: string;
  /**
   * Racetime race goal
   */
  goal?: string;
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
  status?: "open" | "invitational" | "pending" | "in_progress" | "finished" | "cancelled";
}
export interface Player {
  nickname: string;
  color: string;
  goalCount: number;
  racetimeStatus: RacetimeStatusDisconnected | RacetimeStatusConnected;
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
  status: "requested" | "invited" | "declined" | "ready" | "not_ready" | "in_progress" | "done" | "dnf" | "dq";
}
