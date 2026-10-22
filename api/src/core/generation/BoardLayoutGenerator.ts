import { generateMagicSquare } from './layoutHelpers/MagicSquare';
import { GeneratorSettings } from '@playbingo/shared';
import { chunk, shuffle } from '../../util/Array';
import { BoardGenerator, LayoutCell } from './BoardGenerator';

type BoardLayout = GeneratorSettings['boardLayout'];

export type BoardLayoutGenerator = (generator: BoardGenerator) => void;

export const createLayoutGenerator = (strategy: BoardLayout) => {
    switch (strategy.mode) {
        case 'random':
            return noLayout;
        case 'srlv5':
            return magicSquare;
        case 'isaac':
            return staticDifficulty;
        case 'custom':
            return custom;
        case 'difficulty-distribution':
            return difficultyDistribution;
        default:
            // should never happen, strategy.mode is typed as never if the switch is properly exhaustive
            throw Error('Unknown GenerationListMode strategy');
    }
};

const noLayout: BoardLayoutGenerator = (generator) => {
    generator.layout = Array.from({ length: generator.size }, () =>
        Array.from({ length: generator.size }, () => ({
            selectionCriteria: 'random',
        })),
    );
};

const magicSquare: BoardLayoutGenerator = (generator) => {
    generator.layout = generateMagicSquare(generator.size, generator.seed).map(
        (row) =>
            row.map((difficulty) => ({
                selectionCriteria: 'difficulty',
                difficulty,
            })),
    );
};

const staticDifficulty: BoardLayoutGenerator = (generator) => {
    const one: LayoutCell = { selectionCriteria: 'difficulty', difficulty: 1 };
    const two: LayoutCell = { selectionCriteria: 'difficulty', difficulty: 2 };
    const three: LayoutCell = {
        selectionCriteria: 'difficulty',
        difficulty: 3,
    };
    const four: LayoutCell = { selectionCriteria: 'difficulty', difficulty: 4 };
    generator.layout = [
        [two, three, one, one, two],
        [three, one, two, two, one],
        [one, two, four, two, one],
        [two, one, two, one, three],
        [one, two, one, three, two],
    ];
};

const custom: BoardLayoutGenerator = (generator) => {
    if (!generator.customBoardLayout) {
        throw new Error('Custom board layout not provided');
    }
    generator.layout = generator.customBoardLayout;
};

const difficultyDistribution: BoardLayoutGenerator = (generator) => {
    if (!generator.difficultyDistribution) {
        throw new Error('Difficulty distribution configuration not provided');
    }

    const difficulties: number[] = [];
    generator.difficultyDistribution.forEach((difficulty) => {
        difficulties.push(
            ...Array(difficulty.count).fill(difficulty.difficulty),
        );
    });

    shuffle(difficulties, generator.seed);

    generator.layout = chunk(
        difficulties.map((diff) => ({
            selectionCriteria: 'difficulty',
            difficulty: diff,
        })),
        generator.size,
    );
};
