import { shuffle } from '../../util/Array';

describe('shuffle', () => {
    it('should not change the array length', () => {
        const original = [1, 2, 3, 4, 5];
        const copy = [...original];
        shuffle(copy);
        expect(copy.length).toBe(original.length);
    });

    it('should contain the same elements after shuffle', () => {
        const original = [1, 2, 3, 4, 5];
        const copy = [...original];
        shuffle(copy);
        expect(copy.sort()).toEqual(original.sort());
    });

    it('should shuffle the array in place', () => {
        const array = [1, 2, 3, 4, 5];
        const ref = array;
        shuffle(array);
        expect(array).toBe(ref);
    });

    it('should not always return the same order', () => {
        const input = [1, 2, 3, 4, 5];
        const results = new Set<string>();

        for (let i = 0; i < 20; i++) {
            const copy = [...input];
            shuffle(copy);
            results.add(copy.join(','));
        }

        // Not a perfect test, but very unlikely to fail unless shuffle is broken
        expect(results.size).toBeGreaterThan(1);
    });

    it('should handle empty array', () => {
        const array: number[] = [];
        shuffle(array);
        expect(array).toEqual([]);
    });

    it('should handle single-element array', () => {
        const array = [42];
        shuffle(array);
        expect(array).toEqual([42]);
    });

    // this tests a very specific bug that we ran into with a previous
    // implementation. This is a known seed that caused the issue, but the
    // difference in implementation means this seed may never be problematic
    it('should not introduce undefined', () => {
        const array = [1];
        const seed = 609754;
        shuffle(array, seed);
        expect(array).not.toContain(undefined);
    });

    it('should produce the same output when seeded', () => {
        const array = [1, 2, 3, 4, 5];
        const seed = 42;
        const shuffled1 = [...array];
        shuffle(shuffled1, seed);
        const shuffled2 = [...array];
        shuffle(shuffled2, seed);
        expect(shuffled1).toEqual(shuffled2);
    });
});
