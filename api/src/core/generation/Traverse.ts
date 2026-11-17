import { Category, TraversalDirection } from '@prisma/client';
import { GeneratorGoal } from './GeneratorCore';
import { GeneratorSettings } from '@playbingo/shared';
import { BoardGenerator } from './BoardGenerator';
import { GenerationFailedError } from './GenerationFailedError';

/** Preserve random/custom layouts and turn difficulty layouts into directional steps. */
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
    if (
        settings.boardLayout.mode !== 'random' &&
        settings.boardLayout.mode !== 'custom'
    ) {
        generator.layoutGenerator = () => {
            const rated = generator.goals.filter(
                (goal) =>
                    goal.difficulty != null && Number.isFinite(goal.difficulty),
            );
            const lineCount =
                direction === 'LEFT' || direction === 'RIGHT' ? width : height;
            const min = rated.reduce(
                (value, goal) => Math.min(value, goal.difficulty!),
                Infinity,
            );
            const max = rated.reduce(
                (value, goal) => Math.max(value, goal.difficulty!),
                -Infinity,
            );
            const groupWidth = (max - min + 1) / lineCount;
            generator.goalsByDifficulty = Object.fromEntries(
                Array.from({ length: lineCount }, (_, index) => {
                    const lower = Math.floor(min + index * groupWidth);
                    const upper = Math.ceil(min + (index + 1) * groupWidth) - 1;
                    return [
                        index + 1,
                        rated.filter(
                            (goal) =>
                                goal.difficulty! >= lower &&
                                goal.difficulty! <= upper,
                        ),
                    ];
                }),
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
