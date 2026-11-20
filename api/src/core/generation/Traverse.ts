import { Category, TraversalDirection } from '@prisma/client';
import { GeneratorGoal } from './GeneratorCore';
import { GeneratorSettings, usesTraverseSteps } from '@playbingo/shared';
import { BoardGenerator } from './BoardGenerator';
import { GenerationFailedError } from './GenerationFailedError';
import { shuffle } from '../../util/Array';

/** Use the configured layout, with optional directional steps for Traverse. */
export function generateTraverse(
    goals: GeneratorGoal[],
    width: number,
    height: number,
    direction: TraversalDirection,
    seed: number,
    settings: GeneratorSettings = {
        goalFilters: [],
        goalTransformation: [],
        boardLayout: { mode: 'random' },
        restrictions: [],
        adjustments: [],
    },
    categories: Category[] = [],
) {
    const generator = new BoardGenerator(
        goals,
        categories,
        settings,
        width,
        seed,
    );
    if (usesTraverseSteps(settings)) {
        generator.layoutGenerator = () => {
            const rated = generator.goals.filter(
                (goal) =>
                    goal.difficulty != null && Number.isFinite(goal.difficulty),
            );
            const lineCount =
                direction === 'LEFT' || direction === 'RIGHT' ? width : height;
            // Balance the goal supply across steps. Shuffle first so ties can
            // span steps without fixing the same goals to the same lines.
            shuffle(rated, undefined, generator.rng);
            rated.sort((a, b) => a.difficulty! - b.difficulty!);
            generator.goalsByDifficulty = Object.fromEntries(
                Array.from({ length: lineCount }, (_, index) => [
                    index + 1,
                    rated.slice(
                        Math.floor((index * rated.length) / lineCount),
                        Math.floor(((index + 1) * rated.length) / lineCount),
                    ),
                ]),
            );
            generator.layout = Array.from({ length: height }, (_row, row) =>
                Array.from({ length: width }, (_col, col) => ({
                    selectionCriteria: 'difficulty' as const,
                    difficulty:
                        direction === 'UP'
                            ? height - row
                            : direction === 'DOWN'
                              ? row + 1
                              : direction === 'LEFT'
                                ? width - col
                                : col + 1,
                })),
            );
        };
    }
    generator.generateBoard();
    if (
        generator.board.length !== height ||
        generator.board.some((row) => row.length !== width)
    ) {
        throw new GenerationFailedError(
            'Generated board dimensions do not match this room',
            generator,
        );
    }
    return generator.board.map((row) =>
        row.map((goal) => ({
            goal,
            completedTeams: [],
            revealed: true as const,
        })),
    );
}
