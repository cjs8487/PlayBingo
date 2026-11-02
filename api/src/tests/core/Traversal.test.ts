import { BingoMode, TraversalDirection } from '@prisma/client';
import { mock } from 'jest-mock-extended';
import Room, { BoardGenerationMode } from '../../core/Room';
import Player from '../../core/Player';
import { RoomTokenPayload } from '../../auth/RoomAuth';
import { GenerationFailedError } from '../../core/generation/GenerationFailedError';
import { generateTraverse } from '../../core/generation/Traverse';
import * as Goals from '../../database/games/Goals';
import * as Categories from '../../database/games/GoalCategories';
import { hasTraversalCompletion, rowColToMask } from '../../util/RoomUtils';

type Goal = Awaited<ReturnType<typeof Goals.goalsForGameFull>>[number];
const goalPool = () =>
    Array.from({ length: 108 }, (_, index) => ({
        ...mock<Goal>(),
        id: `goal-${index}`,
        difficulty: index < 98 ? 1 + (index % 7) : null,
        categories: [],
        tags: [],
    }));

jest.mock('../../database/Rooms', () => ({
    addMarkAction: jest.fn().mockResolvedValue(undefined),
    addUnmarkAction: jest.fn().mockResolvedValue(undefined),
    setRoomBoard: jest.fn().mockResolvedValue(undefined),
}));

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

it.each(Object.values(TraversalDirection))(
    '%s generates a difficulty ramp and supports exploration and a completed crossing',
    async (direction) => {
        const width = 5,
            height = 3;
        const room = new Room(
            'Test',
            'Test',
            'test',
            'test',
            '',
            'test',
            false,
            BingoMode.TRAVERSE,
            1,
            false,
            'Normal',
            42,
            undefined,
            undefined,
            {
                goalFilters: [],
                goalTransformation: [],
                restrictions: [],
                adjustments: [],
                boardLayout: {
                    mode: 'custom',
                    layout: Array.from({ length: height }, () =>
                        Array.from({ length: width }, () => ({
                            selectionCriteria: 'random' as const,
                        })),
                    ),
                },
            },
            direction,
        );
        jest.spyOn(Goals, 'goalsForGameFull').mockResolvedValue(goalPool());
        jest.spyOn(Categories, 'getCategories').mockResolvedValue([]);
        jest.spyOn(room, 'sendChat').mockImplementation(() => {});
        jest.spyOn(room, 'sendRoomData').mockImplementation(() => {});
        jest.spyOn(room.raceHandler, 'resetTimer').mockImplementation(() => {});
        jest.spyOn(room.raceHandler, 'playerFinished').mockResolvedValue(
            undefined,
        );
        jest.spyOn(room.raceHandler, 'playerUnfinshed').mockResolvedValue(
            undefined,
        );
        jest.spyOn(room.raceHandler, 'allPlayersFinished').mockResolvedValue(
            undefined,
        );
        const player = new Player(room, 'p', 'Player', 'blue', false, false);
        room.players.set(player.id, player);
        await room.generateBoard({
            mode: BoardGenerationMode.RANDOM,
            seed: 42,
        });

        expect(room.board).toHaveLength(height);
        expect(room.board.every((row) => row.length === width)).toBe(true);
        expect(
            new Set(room.board.flat().map((cell) => cell.goal.id)).size,
        ).toBe(width * height);
        expect(
            room.board.flat().every((cell) => cell.goal.difficulty != null),
        ).toBe(true);
        const horizontal = direction === 'LEFT' || direction === 'RIGHT';
        const reversed = direction === 'UP' || direction === 'LEFT';
        const lines = horizontal
            ? Array.from({ length: width }, (_, col) =>
                  room.board.map((row) => row[col]),
              )
            : [...room.board];
        if (reversed) lines.reverse();
        const averages = lines.map(
            (line) =>
                line.reduce((sum, cell) => sum + cell.goal.difficulty!, 0) /
                line.length,
        );
        for (let index = 1; index < averages.length; index++)
            expect(averages[index]).toBeGreaterThanOrEqual(averages[index - 1]);
        expect(averages.at(-1)).toBeGreaterThan(averages[0]);

        const visible = player.obfuscateBoard();
        const start = reversed ? lines.length - 1 : 0;
        visible.forEach((row, r) =>
            row.forEach((cell, c) => {
                expect(cell.revealed).toBe((horizontal ? c : r) === start);
                if (!cell.revealed) expect(cell).not.toHaveProperty('goal');
            }),
        );
        const auth = { ...mock<RoomTokenPayload>(), playerId: player.id };
        const mark = (row: number, col: number) =>
            room.handleMark({ action: 'mark', payload: { row, col } }, auth);
        mark(1, 2);
        expect(player.goalCount).toBe(0);
        const coordinate = (step: number): [number, number] => {
            const position = reversed ? start - step : step;
            return horizontal ? [1, position] : [position, 2];
        };
        for (let step = 0; step < lines.length; step++) {
            expect(player.goalComplete).toBe(false);
            mark(...coordinate(step));
            if (step + 1 < lines.length)
                expect(player.hasRevealed(...coordinate(step + 1))).toBe(true);
        }
        expect(player.goalComplete).toBe(true);
        const [row, col] = coordinate(1);
        room.handleUnmark({ action: 'unmark', payload: { row, col } }, auth);
        expect(player.goalComplete).toBe(false);
    },
);

it('requires an edge-connected path rather than diagonal or disconnected marks', () => {
    const mask = (cells: number[][]) =>
        cells.reduce(
            (bits, [row, col]) => bits | rowColToMask(row, col, 3),
            0n,
        );
    expect(
        hasTraversalCompletion(
            mask([
                [0, 0],
                [1, 0],
                [1, 1],
                [2, 1],
            ]),
            3,
            3,
            'DOWN',
        ),
    ).toBe(true);
    expect(
        hasTraversalCompletion(
            mask([
                [0, 0],
                [1, 1],
                [2, 2],
            ]),
            3,
            3,
            'DOWN',
        ),
    ).toBe(false);
    expect(
        hasTraversalCompletion(
            mask([
                [0, 2],
                [1, 0],
                [2, 0],
            ]),
            3,
            3,
            'DOWN',
        ),
    ).toBe(false);
});

it('fails when the eligible pool cannot fill a difficulty group', () => {
    const sparse = goalPool()
        .slice(0, 25)
        .map((goal, index) => ({ ...goal, difficulty: index === 24 ? 7 : 1 }));
    expect(() => generateTraverse(sparse, 5, 5, 'DOWN', 42)).toThrow(
        GenerationFailedError,
    );
});
