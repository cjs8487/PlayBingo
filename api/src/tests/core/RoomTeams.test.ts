import { BingoMode } from '@prisma/client';
import {
    ChangeColorAction,
    JoinAction,
    JoinTeamAction,
    MarkAction,
    RevealedCell,
    SetTeamsEnabledAction,
    UnmarkAction,
} from '@playbingo/types';
import { WebSocket } from 'ws';
import { RoomTokenPayload } from '../../auth/RoomAuth';
import Room from '../../core/Room';
import {
    createUpdatePlayer,
    createUpdateTeam,
    updateTeamsEnabled,
} from '../../database/Rooms';

jest.mock('../../database/Rooms', () => ({
    addChangeColorAction: jest.fn().mockResolvedValue(undefined),
    addChatAction: jest.fn().mockResolvedValue(undefined),
    addJoinAction: jest.fn().mockResolvedValue(undefined),
    addLeaveAction: jest.fn().mockResolvedValue(undefined),
    addMarkAction: jest.fn().mockResolvedValue(undefined),
    addUnmarkAction: jest.fn().mockResolvedValue(undefined),
    createUpdatePlayer: jest.fn().mockResolvedValue(undefined),
    createUpdateTeam: jest.fn().mockResolvedValue(undefined),
    setRoomBoard: jest.fn().mockResolvedValue(undefined),
    updateRaceHandler: jest.fn().mockResolvedValue(undefined),
    updateTeamsEnabled: jest.fn().mockResolvedValue(undefined),
}));

const createRoom = () => {
    const room = new Room(
        'Room',
        'Game',
        'game',
        'room',
        '',
        'room-id',
        false,
        BingoMode.LINES,
        1,
        false,
        'Normal',
        1,
    );
    room.board = Array.from({ length: 5 }, (_, row) =>
        Array.from(
            { length: 5 },
            (_, col) =>
                ({
                    goal: {
                        id: `${row}-${col}`,
                        goal: 'Goal',
                        description: null,
                    },
                    completedTeams: [],
                    revealed: true,
                }) as RevealedCell,
        ),
    );
    room.computeVictoryMasks();
    return room;
};

const auth = (playerId: string, isSpectating = false): RoomTokenPayload => ({
    roomSlug: 'room',
    uuid: `${playerId}-connection`,
    playerId,
    isSpectating,
    isMonitor: true,
});

const socket = () => ({ readyState: 0, send: jest.fn() }) as unknown as WebSocket;

const joinAction = (nickname: string) =>
    ({ action: 'join', payload: { nickname } }) as JoinAction;

describe('Room team workflows', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('creates a team for a joining player and exposes team-owned state', () => {
        const room = createRoom();
        const result = room.handleJoin(joinAction('Alice'), auth('alice'), socket());

        expect(result.action).toBe('connected');
        expect(room.teams.size).toBe(1);
        expect(result).toMatchObject({
            roomData: { teamsEnabled: false },
        });
        const team = room.getTeamForPlayer('alice');
        expect(team).toMatchObject({ name: 'Team Alice', color: 'blue' });
        expect(room.getPlayerById('alice')?.teamId).toBe(team?.id);
        expect(createUpdateTeam).toHaveBeenCalledWith('room-id', team);
        expect(createUpdatePlayer).toHaveBeenCalledWith(
            'room-id',
            room.getPlayerById('alice'),
        );
        expect(room.chatHistory).toContainEqual([
            { contents: 'Alice', color: 'blue' },
            ' has joined.',
        ]);
    });

    it('tracks marks by team ID and applies the team color', () => {
        const room = createRoom();
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        const team = room.getTeamForPlayer('alice')!;

        room.handleMark(
            { action: 'mark', payload: { row: 0, col: 0 } } as MarkAction,
            auth('alice'),
        );
        expect(room.board[0][0].completedTeams).toEqual([team.id]);
        expect(team.hasMarked(0, 0)).toBe(true);

        room.handleUnmark(
            { action: 'unmark', payload: { row: 0, col: 0 } } as UnmarkAction,
            auth('alice'),
        );
        expect(room.board[0][0].completedTeams).toEqual([]);
        expect(team.hasMarked(0, 0)).toBe(false);

        room.handleChangeColor(
            { action: 'changeColor', payload: { color: 'red' } } as ChangeColorAction,
            auth('alice'),
        );
        expect(team.color).toBe('red');
        expect(createUpdateTeam).toHaveBeenLastCalledWith('room-id', team);
    });

    it('permits joining another team only when teams are enabled', () => {
        const room = createRoom();
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        room.handleJoin(joinAction('Bob'), auth('bob'), socket());
        const aliceTeam = room.getTeamForPlayer('alice')!;

        const joinTeam = {
            action: 'joinTeam',
            payload: { teamId: aliceTeam.id },
        } as JoinTeamAction;
        expect(room.handleJoinTeam(joinTeam, auth('bob'))).toEqual({
            action: 'forbidden',
        });

        room.handleSetTeamsEnabled(
            {
                action: 'setTeamsEnabled',
                payload: { enabled: true },
            } as SetTeamsEnabledAction,
        );
        expect(updateTeamsEnabled).toHaveBeenCalledWith('room-id', true);
        expect(room.handleJoinTeam(joinTeam, auth('bob'))?.action).toBe(
            'joinedTeam',
        );
        expect(room.getTeamForPlayer('bob')).toBe(aliceTeam);
    });

    it('uses player names for single-player rooms and team names when enabled', () => {
        const room = createRoom();
        room.handleJoin(joinAction('Alice'), auth('alice'), socket());
        const team = room.getTeamForPlayer('alice')!;

        expect(room.getTeamDisplayName(team)).toBe('Alice');
        room.handleSetTeamsEnabled(
            {
                action: 'setTeamsEnabled',
                payload: { enabled: true },
            } as SetTeamsEnabledAction,
        );
        expect(room.getTeamDisplayName(team)).toBe('Team Alice');
    });
});