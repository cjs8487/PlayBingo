import prand from 'pure-rand';

/**
 * Breaks an array in chunks of a fixed size. If the array size is not a
 * multiple of the chunk size, the last element will contain all the remaining
 * elements (and be smaller than the chunk size)
 *
 * @param array Input array
 * @param groupSize The size of the chunks
 * @returns The chunked array
 */
export const chunk = <T>(array: T[], groupSize: number) => {
    const copy = [...array];
    const groups: T[][] = [];
    while (copy.length > 0) {
        const groupItems = copy.splice(0, groupSize);
        groups.push(groupItems);
    }
    return groups;
};

/**
 * Shuffle an array in place with Fisher-Yates
 * @param array the array to shuffle
 */
export const shuffle = (array: unknown[], seedIn?: number) => {
    const seed = seedIn ?? Math.ceil(999999 * Math.random());
    const rng = prand.xoroshiro128plus(seed);

    for (let i = array.length - 1; i > 0; i--) {
        const j = prand.unsafeUniformIntDistribution(0, i, rng);
        [array[i], array[j]] = [array[j], array[i]];
    }
};
