/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

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
