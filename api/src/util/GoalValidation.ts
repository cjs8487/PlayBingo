import { Prisma } from '@prisma/client';

const MAX_BYTES = 4096; // measure bytes, not string length

export interface GoalMetaValidationResult {
  valid: boolean;
  error?: string;
}

const DANGEROUS_KEYS = new Set([
  '__proto__',     // Direct prototype access
  'prototype',     // Constructor prototype  
  'constructor',   // Constructor function
  'toString',      // Could override object stringification
  'valueOf'        // Could override object value conversion
]);

/**
 * Check for dangerous keys in the meta object.
 * Simple recursive check - safe for 4KB payloads.
 */
function checkDangerousKeys(meta: Prisma.JsonValue): string | null {
  if (meta === null || meta === undefined || typeof meta !== 'object') {
    return null;
  }

  if (Array.isArray(meta)) {
    // Check array elements
    for (const item of meta) {
      const result = checkDangerousKeys(item);
      if (result) return result;
    }
  } else {
    // Check object keys
    for (const [key, value] of Object.entries(meta) as [string, Prisma.JsonValue][]) {
      if (DANGEROUS_KEYS.has(key)) {
        return `Goal meta contains forbidden key "${key}"`;
      }
      // Recursively check nested values
      const result = checkDangerousKeys(value);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Validate meta with all guards and early exits.
 */
export function validateGoalMeta(meta: Prisma.JsonValue): GoalMetaValidationResult {
  // Allow null/undefined values
  if (meta === null || meta === undefined) {
    return { valid: true };
  }

  try {
    // Convert to JSON and measure bytes (UTF-8)
    const json = JSON.stringify(meta); // also ensures it's JSON-serializable
    const bytes = Buffer.byteLength(json, 'utf8');

    if (bytes > MAX_BYTES) {
      return {
        valid: false,
        error: `Goal meta exceeds maximum size of ${MAX_BYTES} bytes (got ${bytes})`,
      };
    }

    const dangerousKeyError = checkDangerousKeys(meta);
    if (dangerousKeyError) {
      return { valid: false, error: dangerousKeyError };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid JSON data for goal meta: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}