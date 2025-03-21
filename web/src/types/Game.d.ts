/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * An incoming websocket message from the server telling the client of a change in room state or instructing it to take an action
 */
export interface Game {
  name: string;
  slug: string;
  coverImage?: string;
  owners?: User[];
  moderators?: User[];
  favorited?: boolean;
  isMod?: boolean;
  enableSRLv5?: boolean;
  racetimeBeta?: boolean;
  racetimeCategory?: string;
  racetimeGoal?: string;
  difficultyVariantsEnabled?: boolean;
  difficultyVariants?: DifficultyVariant[];
  difficultyGroups?: number;
  slugWords?: string[];
  useTypedRandom?: boolean;
}
export interface User {
  id: string;
  username: string;
  email?: string;
  staff: boolean;
  racetimeConnected?: boolean;
}
export interface DifficultyVariant {
  id?: string;
  name: string;
  goalAmounts?: number[];
}
