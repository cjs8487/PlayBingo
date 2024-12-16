/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * An outgoing client websocket message sent when a client performs an action in a room
 */
export type RoomAction = (
  | JoinAction
  | LeaveAction
  | ChatAction
  | MarkAction
  | UnmarkAction
  | ChangeColorAction
  | NewCardAction
  | RevealCardAction
) & {
  /**
   * JWT for the room obtained from the server
   */
  authToken: string;
};

export interface JoinAction {
  action: "join";
  payload?: {
    nickname: string;
  };
}
export interface LeaveAction {
  action: "leave";
}
export interface ChatAction {
  action: "chat";
  payload: {
    message: string;
  };
}
export interface MarkAction {
  action: "mark";
  payload: {
    row: number;
    col: number;
  };
}
export interface UnmarkAction {
  action: "unmark";
  payload: {
    row: number;
    col: number;
  };
}
export interface ChangeColorAction {
  action: "changeColor";
  payload: {
    color: string;
  };
}
export interface NewCardAction {
  action: "newCard";
  options?: {
    seed?: number;
    mode: string;
    difficulty?: string;
  };
}
export interface RevealCardAction {
  action: "revealCard";
}
