import { GeneratorSettings } from '@playbingo/shared';
import { BingoMode, TraversalDirection } from '@prisma/client';
import { mock } from 'jest-mock-extended';
import Room, { BoardGenerationMode } from '../../core/Room';
import Player from '../../core/Player';
import { RoomTokenPayload } from '../../auth/RoomAuth';
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
    '%s preserves a custom layout and supports team exploration and a completed crossing',
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
            width,
            height,
            true,
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
        const player = new Player(room, 'p', 'Player', false);
        const team = room.createTeamForPlayer(player);
        const teammate = new Player(room, 'p2', 'Teammate', false, team.id);
        team.addPlayer(teammate);
        await room.generateBoard({
            mode: BoardGenerationMode.RANDOM,
            seed: 42,
        });

        expect(room.board).toHaveLength(height);
        expect(room.board.every((row) => row.length === width)).toBe(true);
        expect(
            new Set(room.board.flat().map((cell) => cell.goal.id)).size,
        ).toBe(width * height);
        const horizontal = direction === 'LEFT' || direction === 'RIGHT';
        const reversed = direction === 'UP' || direction === 'LEFT';
        const lines = horizontal
            ? Array.from({ length: width }, (_, col) =>
                  room.board.map((row) => row[col]),
              )
            : [...room.board];
        if (reversed) lines.reverse();
        const visible = team.obfuscateBoard();
        const start = reversed ? lines.length - 1 : 0;
        visible.forEach((row, r) =>
            row.forEach((cell, c) => {
                expect(cell.revealed).toBe((horizontal ? c : r) === start);
                if (!cell.revealed) expect(cell).not.toHaveProperty('goal');
            }),
        );
        const auth = { ...mock<RoomTokenPayload>(), playerId: player.id };
        const mark = (row: number, col: number, playerId = player.id) =>
            room.handleMark(
                { action: 'mark', payload: { row, col } },
                { ...auth, playerId },
            );
        mark(1, 2);
        expect(team.goalCount).toBe(0);
        const coordinate = (step: number): [number, number] => {
            const position = reversed ? start - step : step;
            return horizontal ? [1, position] : [position, 2];
        };
        for (let step = 0; step < lines.length; step++) {
            expect(team.goalComplete).toBe(false);
            mark(...coordinate(step), step % 2 ? teammate.id : player.id);
            if (step + 1 < lines.length)
                expect(team.hasRevealed(...coordinate(step + 1))).toBe(true);
        }
        expect(team.goalComplete).toBe(true);
        const [row, col] = coordinate(1);
        room.handleUnmark({ action: 'unmark', payload: { row, col } }, auth);
        expect(team.goalComplete).toBe(false);
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

const settingsFor = (
    boardLayout: GeneratorSettings['boardLayout'],
): GeneratorSettings => ({
    goalFilters: [],
    goalTransformation: [],
    restrictions: [],
    adjustments: [],
    boardLayout,
});

it('fills random layouts without requiring difficulties', () => {
    const goals = goalPool()
        .slice(0, 16)
        .map((goal) => ({ ...goal, difficulty: null }));
    const board = generateTraverse(goals, 4, 4, 'UP', 42);
    expect(board).toHaveLength(4);
    expect(board.every((row) => row.length === 4)).toBe(true);
    expect(new Set(board.flat().map((cell) => cell.goal.id)).size).toBe(16);
});

it('preserves custom cell criteria and only requires difficulties where specified', () => {
    const goals = goalPool()
        .slice(0, 3)
        .map((goal, index) => ({
            ...goal,
            difficulty: index === 1 ? 7 : null,
        }));
    const board = generateTraverse(
        goals,
        3,
        1,
        'RIGHT',
        42,
        settingsFor({
            mode: 'custom',
            layout: [
                [
                    { selectionCriteria: 'fixed', goal: goals[0].id },
                    { selectionCriteria: 'difficulty', difficulty: 7 },
                    { selectionCriteria: 'random' },
                ],
            ],
        }),
    );
    expect(board[0].map((cell) => cell.goal.id)).toEqual([
        goals[0].id,
        goals[1].id,
        goals[2].id,
    ]);
});

it('preserves the configured difficulty layout without the Traverse opt-in', () => {
    const board = generateTraverse(
        goalPool(),
        5,
        5,
        'DOWN',
        42,
        settingsFor({ mode: 'isaac' }),
    );
    expect(board[0].map((cell) => cell.goal.difficulty)).toEqual([
        2, 3, 1, 1, 2,
    ]);
    expect(board[2][2].goal.difficulty).toBe(4);
});

it.each<[TraversalDirection, GeneratorSettings['boardLayout']]>([
    ['UP', { mode: 'srlv5', traverseSteps: true }],
    ['DOWN', { mode: 'isaac', traverseSteps: true }],
    [
        'LEFT',
        {
            mode: 'difficulty-distribution',
            distribution: [{ difficulty: 1, count: 25 }],
            traverseSteps: true,
        },
    ],
    ['RIGHT', { mode: 'srlv5', traverseSteps: true }],
])(
    '%s replaces difficulty layouts with increasing steps',
    (direction, layout) => {
        const board = generateTraverse(
            goalPool(),
            5,
            5,
            direction,
            42,
            settingsFor(layout),
        );
        const lines =
            direction === 'LEFT' || direction === 'RIGHT'
                ? Array.from({ length: 5 }, (_, col) =>
                      board.map((row) => row[col]),
                  )
                : [...board];
        if (direction === 'UP' || direction === 'LEFT') lines.reverse();
        const averages = lines.map(
            (line) =>
                line.reduce((sum, cell) => sum + cell.goal.difficulty!, 0) /
                line.length,
        );
        for (let index = 1; index < averages.length; index++)
            expect(averages[index]).toBeGreaterThanOrEqual(averages[index - 1]);
        expect(averages.at(-1)).toBeGreaterThan(averages[0]);
    },
);

it.each([1, 7])(
    'reuses difficulty levels across steps with a final difficulty of %s',
    (lastDifficulty) => {
        const goals = goalPool()
            .slice(0, 25)
            .map((goal, index) => ({
                ...goal,
                difficulty: index === 24 ? lastDifficulty : 1,
            }));
        const board = generateTraverse(
            goals,
            5,
            5,
            'DOWN',
            42,
            settingsFor({ mode: 'srlv5', traverseSteps: true }),
        );
        expect(new Set(board.flat().map((cell) => cell.goal.id)).size).toBe(25);
        expect(
            board
                .slice(0, 4)
                .flat()
                .every((cell) => cell.goal.difficulty === 1),
        ).toBe(true);
        expect(board[4].map((cell) => cell.goal.difficulty)).toContain(
            lastDifficulty,
        );
    },
);
