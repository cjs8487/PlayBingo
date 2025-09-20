/**
 * Validation utilities for Goal meta data
 */

// Maximum size for goal meta JSON in characters
const GOAL_META_MAX_SIZE = 4096;

export interface GoalMetaValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates goal meta data against size constraints
 * @param meta - The meta data to validate (can be any JSON-serializable value)
 * @returns Validation result with success status and optional error message
 */
export function validateGoalMeta(meta: any): GoalMetaValidationResult {
  // Allow null/undefined values
  if (meta === null || meta === undefined) {
    return { valid: true };
  }

  try {
    // Convert to JSON string to check size
    const metaString = JSON.stringify(meta); // also checks for invalid JSON
    
    if (metaString.length > GOAL_META_MAX_SIZE) {
      return {
        valid: false,
        error: `Goal meta exceeds maximum size of ${GOAL_META_MAX_SIZE} characters (got ${metaString.length})`
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid JSON data for goal meta: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Gets the maximum allowed size for goal meta data
 * @returns Maximum size in characters
 */
export function getGoalMetaMaxSize(): number {
  return GOAL_META_MAX_SIZE;
}
