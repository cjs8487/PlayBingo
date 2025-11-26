import { validateGoalMeta } from '../util/GoalValidation';

describe('GoalValidation', () => {
  describe('validateGoalMeta', () => {
    it('should allow null and undefined values', () => {
      expect(validateGoalMeta(null)).toEqual({ valid: true });
      expect(validateGoalMeta(undefined as any)).toEqual({ valid: true });
    });

    it('should allow simple valid objects', () => {
      const validMeta = {
        type: 'auto-track',
        config: { enabled: true },
        tags: ['important', 'urgent']
      };
      expect(validateGoalMeta(validMeta)).toEqual({ valid: true });
    });

    it('should reject objects that exceed byte size limit', () => {
      // Create a large string that exceeds 4096 bytes
      const largeString = 'x'.repeat(5000);
      const largeMeta = { data: largeString };
      
      const result = validateGoalMeta(largeMeta);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum size of 4096 bytes');
    });

    it('should allow deeply nested objects under byte limit', () => {
      // Create a deeply nested object that's still under byte limit
      function makeDeepObject(depth: number) {
        let obj: any = {};
        let cur = obj;
        for (let i = 0; i < depth; i++) {
          cur.a = {};
          cur = cur.a;
        }
        return obj;
      }

      const deepObject = makeDeepObject(10); // Deep but small
      const result = validateGoalMeta(deepObject);
      
      expect(result.valid).toBe(true);
    });

    it('should reject objects with dangerous prototype pollution keys', () => {
      // Create object with dangerous key using Object.defineProperty to bypass JS filtering
      const dangerousMeta: any = { normal: 'value' };
      Object.defineProperty(dangerousMeta, '__proto__', {
        value: { isAdmin: true },
        enumerable: true,
        configurable: true
      });
      
      const result = validateGoalMeta(dangerousMeta);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('contains forbidden key "__proto__"');
    });

    it('should reject objects with prototype key', () => {
      const dangerousMeta = {
        prototype: { isAdmin: true },
        normal: 'value'
      };
      
      const result = validateGoalMeta(dangerousMeta);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('contains forbidden key "prototype"');
    });

    it('should reject objects with constructor key', () => {
      const dangerousMeta = {
        constructor: { isAdmin: true },
        normal: 'value'
      };
      
      const result = validateGoalMeta(dangerousMeta);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('contains forbidden key "constructor"');
    });

    it('should reject objects with toString key', () => {
      const dangerousMeta = {
        toString: 'hacked',
        normal: 'value'
      };
      
      const result = validateGoalMeta(dangerousMeta as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('contains forbidden key "toString"');
    });

    it('should reject objects with valueOf key', () => {
      const dangerousMeta = {
        valueOf: 'hacked',
        normal: 'value'
      };
      
      const result = validateGoalMeta(dangerousMeta as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('contains forbidden key "valueOf"');
    });

    it('should handle arrays correctly', () => {
      const arrayMeta = {
        items: [1, 2, 3, { nested: true }],
        count: 4
      };
      
      expect(validateGoalMeta(arrayMeta)).toEqual({ valid: true });
    });

    it('should handle deeply nested arrays', () => {
      const deepArray = [[[[[['deep']]]]]]; // 6 levels deep
      const result = validateGoalMeta(deepArray);
      
      expect(result.valid).toBe(true); // No depth limit, only byte limit
    });

    it('should reject non-JSON-serializable data', () => {
      // Create truly non-serializable data with circular reference
      const nonSerializable: any = {
        normal: 'value'
      };
      nonSerializable.self = nonSerializable; // Circular reference
      
      const result = validateGoalMeta(nonSerializable);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON data for goal meta');
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      const result = validateGoalMeta(circular);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON data for goal meta');
    });
  });

  // Removed analyzeGoalMeta tests - function no longer exists

  describe('Depth Bomb Attack Simulation', () => {
    it('should handle depth bomb with recursive traversal (safe for 4KB payloads)', () => {
      // Create a depth bomb that would crash recursive implementations
      function makeDepthBomb(depth: number) {
        let obj: any = {};
        let cur = obj;
        for (let i = 0; i < depth; i++) {
          cur.a = {};
          cur = cur.a;
        }
        return obj;
      }

      // Test with a depth that would cause stack overflow in recursive implementations
      const depthBomb = makeDepthBomb(500); // Deep but under byte limit
      const json = JSON.stringify(depthBomb);
      
      // Verify it's under byte limit
      expect(Buffer.byteLength(json, 'utf8')).toBeLessThan(4096);
      
      // Our recursive implementation should handle this gracefully for 4KB payloads
      const result = validateGoalMeta(depthBomb);
      expect(result.valid).toBe(true); // Valid because under byte limit
    });

    it('should handle wide but shallow objects', () => {
      // Create an object with many properties but shallow depth
      const wideObject: any = {};
      for (let i = 0; i < 100; i++) {
        wideObject[`prop${i}`] = `value${i}`;
      }
      
      // Should be valid (no property count limit, shallow depth)
      expect(validateGoalMeta(wideObject)).toEqual({ valid: true });
    });

    it('should handle large arrays', () => {
      // Create a large array (no array length limit) but keep it under byte limit
      const largeArray = new Array(100).fill(0).map((_, i) => ({ id: i, value: `item${i}` }));
      
      // Should be valid (no array length limit)
      expect(validateGoalMeta(largeArray)).toEqual({ valid: true });
    });
  });
});
