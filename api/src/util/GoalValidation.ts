/**
 * Validation utilities for Goal meta data.
 * 
 * This module provides comprehensive validation for goal metadata to prevent abuse
 * through oversized payloads, excessive property counts, and deep nesting attacks.
 * It enforces three key constraints:
 * - Maximum JSON string size (4096 characters)
 * - Maximum total properties across all nesting levels (20)
 * - Maximum nesting depth (5 levels)
 * 
 * The validation is designed to prevent common attack vectors while allowing
 * reasonable flexibility for legitimate goal metadata use cases.
 */

/**
 * Maximum size for goal meta JSON in characters.
 * Prevents memory exhaustion and DoS attacks through oversized payloads.
 * 4096 characters is sufficient for reasonable metadata while preventing abuse.
 */
const GOAL_META_MAX_SIZE = 4096;

/**
 * Maximum total properties across all nesting levels in goal meta.
 * Prevents abuse through nested objects that bypass flat property limits.
 * 20 properties is reasonable for goal metadata while preventing spam/abuse.
 */
const GOAL_META_MAX_TOTAL_PROPERTIES = 20;

/**
 * Maximum nesting depth for goal meta objects.
 * Prevents deep recursion attacks and excessive nesting that could cause stack overflow.
 * 5 levels deep is sufficient for reasonable nested metadata structures.
 */
const GOAL_META_MAX_DEPTH = 5;

/**
 * Result of goal meta validation containing success status and optional error message.
 */
export interface GoalMetaValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Analysis result of nested object structure containing property count and depth information.
 */
export interface NestedPropertyCount {
  totalProperties: number;
  maxDepth: number;
}

/**
 * Recursively counts all properties in nested objects and arrays.
 * This function traverses the entire object structure to count properties at all nesting levels,
 * which is essential for preventing abuse through nested object structures.
 * 
 * @param obj - The object to analyze (can be any JSON-serializable value)
 * @param currentDepth - Current nesting depth (starts at 0 for root level)
 * @returns Object containing total property count and maximum depth reached
 */
function countNestedProperties(obj: any, currentDepth: number = 0): NestedPropertyCount {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return { totalProperties: 0, maxDepth: currentDepth };
  }

  let totalProperties = 0;
  let maxDepth = currentDepth;

  if (Array.isArray(obj)) {
    // For arrays, count each element
    for (const item of obj) {
      const itemCount = countNestedProperties(item, currentDepth + 1);
      totalProperties += itemCount.totalProperties;
      maxDepth = Math.max(maxDepth, itemCount.maxDepth);
    }
  } else {
    // For objects, count each property
    for (const [key, value] of Object.entries(obj)) {
      totalProperties++; // Count the property itself
      
      // Recursively count nested properties
      const nestedCount = countNestedProperties(value, currentDepth + 1);
      totalProperties += nestedCount.totalProperties;
      maxDepth = Math.max(maxDepth, nestedCount.maxDepth);
    }
  }

  return { totalProperties, maxDepth };
}

/**
 * Validates goal meta data against size and structure constraints.
 * This function enforces three key security and performance limits:
 * 1. JSON string size limit to prevent memory exhaustion
 * 2. Total property count limit to prevent abuse through nested objects
 * 3. Maximum nesting depth to prevent recursion attacks
 * 
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

    // Count nested properties and depth
    const { totalProperties, maxDepth } = countNestedProperties(meta);

    // Check total property count
    if (totalProperties > GOAL_META_MAX_TOTAL_PROPERTIES) {
      return {
        valid: false,
        error: `Goal meta exceeds maximum total properties of ${GOAL_META_MAX_TOTAL_PROPERTIES} (got ${totalProperties})`
      };
    }

    // Check maximum depth
    if (maxDepth > GOAL_META_MAX_DEPTH) {
      return {
        valid: false,
        error: `Goal meta exceeds maximum nesting depth of ${GOAL_META_MAX_DEPTH} (got ${maxDepth})`
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
 * Gets the maximum allowed size for goal meta data.
 * @returns Maximum size in characters (4096)
 */
export function getGoalMetaMaxSize(): number {
  return GOAL_META_MAX_SIZE;
}

/**
 * Gets the maximum allowed total properties for goal meta data.
 * @returns Maximum total properties across all nesting levels (20)
 */
export function getGoalMetaMaxTotalProperties(): number {
  return GOAL_META_MAX_TOTAL_PROPERTIES;
}

/**
 * Gets the maximum allowed nesting depth for goal meta data.
 * @returns Maximum nesting depth (5)
 */
export function getGoalMetaMaxDepth(): number {
  return GOAL_META_MAX_DEPTH;
}

/**
 * Analyzes goal meta data structure without performing validation.
 * Useful for debugging, logging, or understanding the structure of meta data.
 * 
 * @param meta - The meta data to analyze (can be any JSON-serializable value)
 * @returns Analysis result with property count and depth information
 */
export function analyzeGoalMeta(meta: any): NestedPropertyCount {
  if (meta === null || meta === undefined) {
    return { totalProperties: 0, maxDepth: 0 };
  }
  return countNestedProperties(meta);
}
