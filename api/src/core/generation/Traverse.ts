import { Category, TraversalDirection } from '@prisma/client';
import { GeneratorGoal } from './GeneratorCore';
import { GenerationFailedError } from './GenerationFailedError';
import { GeneratorSettings } from '@playbingo/shared';
import { BoardGenerator } from './BoardGenerator';

/** Configure the standard difficulty selector with normalized groups and a directional layout. */
export function generateTraverse(
    goals: GeneratorGoal[],
    width: number,
    height: number,
    direction: TraversalDirection,
    seed: number,
    settings?: GeneratorSettings,
    categories: Category[] = [],
) {
    const generator = new BoardGenerator(
        goals,
        categories,
        settings ?? {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'random' },
            restrictions: [],
            adjustments: [],
        },
        seed,
    );
    generator.layoutGenerator = () => {
        const rated = [
            ...new Map(
                generator.goals
                    .filter(
                        (goal) =>
                            goal.difficulty != null &&
                            Number.isFinite(goal.difficulty),
                    )
                    .map((goal) => [goal.id, goal]),
            ).values(),
        ];
        const lineCount =
            direction === 'LEFT' || direction === 'RIGHT' ? width : height;
        if (lineCount < 2 || rated.length < width * height) {
            throw new GenerationFailedError(
                'Not enough goals to fill the board.',
                generator,
            );
        }
        const min = rated.reduce(
            (value, goal) => Math.min(value, goal.difficulty!),
            Infinity,
        );
        const max = rated.reduce(
            (value, goal) => Math.max(value, goal.difficulty!),
            -Infinity,
        );
        if (min === max)
            throw new GenerationFailedError(
                'The selected goals do not have enough difficulty variation to generate a board.',
                generator,
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
        generator.layout = Array.from({ length: height }, (_, row) =>
            Array.from({ length: width }, (_, col) => ({
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
    generator.generateBoard();
    return generator.board.map((row) =>
        row.map((goal) => ({
            goal,
            completedPlayers: [],
            revealed: true as const,
        })),
    );
}
