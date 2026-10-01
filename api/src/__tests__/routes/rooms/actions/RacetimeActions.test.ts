import { ConnectionService } from '@prisma/client';
import Room from '../../../../core/Room';
import { handleRacetimeAction } from '../../../../routes/rooms/actions/RacetimeActions';
import { getConnectionForUser } from '../../../../database/Connections';
import { getRacetimeConfiguration } from '../../../../database/games/Games';
import { connectRoomToRacetime } from '../../../../database/Rooms';
import { getAccessToken } from '../../../../lib/RacetimeConnector';
import { RoomTokenPayload } from '../../../../auth/RoomAuth';

jest.mock('../../../../lib/RacetimeConnector', () => ({
    getAccessToken: jest.fn(),
}));

describe('RacetimeActions', () => {
    let mockRoom: Room;
    const monitorToken: RoomTokenPayload = {
        roomSlug: 'test-room-slug',
        uuid: 'test-uuid-1',
        playerId: 'player-1',
        isMonitor: true,
        isSpectating: false,
    };
    const playerToken: RoomTokenPayload = {
        roomSlug: 'test-room-slug',
        uuid: 'test-uuid-2',
        playerId: 'player-1',
        isMonitor: false,
        isSpectating: false,
    };
    const spectatorToken: RoomTokenPayload = {
        roomSlug: 'test-room-slug',
        uuid: 'test-uuid-3',
        playerId: 'player-1',
        isMonitor: false,
        isSpectating: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(global, 'fetch').mockImplementation(jest.fn());
        mockRoom = {
            slug: 'test-room-slug',
            gameSlug: 'oot',
            logInfo: jest.fn(),
            logWarn: jest.fn(),
            refreshRacetimeHandler: jest.fn(),
            joinRaceRoom: jest.fn(),
            readyPlayer: jest.fn(),
            unreadyPlayer: jest.fn(),
            handleRacetimeRoomCreated: jest.fn(),
        } as unknown as Room;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('403 when no racetime connection exists for user', async () => {
        (getConnectionForUser as jest.Mock).mockResolvedValueOnce(null);

        const result = await handleRacetimeAction(
            mockRoom,
            'refresh',
            'user1',
            playerToken,
        );
        expect(result).toEqual({ code: 403, message: 'Forbidden' });
        expect(mockRoom.logInfo).toHaveBeenCalledWith(
            'Unable to join a user to the racetime room - no racetime connection found',
        );
    });

    describe('action: create', () => {
        it('403 when roomToken.isMonitor is false', async () => {
            const result = await handleRacetimeAction(
                mockRoom,
                'create',
                'user1',
                playerToken,
            );
            expect(result).toEqual({ code: 403, message: 'Forbidden' });
        });

        it('400 when game is not properly configured for racetime', async () => {
            (getRacetimeConfiguration as jest.Mock).mockResolvedValueOnce(null);
            let result = await handleRacetimeAction(
                mockRoom,
                'create',
                'user1',
                monitorToken,
            );
            expect(result.code).toBe(400);

            (getRacetimeConfiguration as jest.Mock).mockResolvedValueOnce({
                racetimeCategory: null,
                racetimeGoal: 'Bingo',
            });
            result = await handleRacetimeAction(
                mockRoom,
                'create',
                'user1',
                monitorToken,
            );
            expect(result.code).toBe(400);
        });

        it('403 when getAccessToken returns null', async () => {
            (getRacetimeConfiguration as jest.Mock).mockResolvedValueOnce({
                racetimeCategory: 'oot',
                racetimeGoal: 'Bingo',
            });
            (getAccessToken as jest.Mock).mockResolvedValueOnce(null);

            const result = await handleRacetimeAction(
                mockRoom,
                'create',
                'user1',
                monitorToken,
            );
            expect(result).toEqual({
                code: 403,
                message: 'Unable to get auth token',
            });
        });

        it('400 when the startrace response is not ok', async () => {
            (getRacetimeConfiguration as jest.Mock).mockResolvedValueOnce({
                racetimeCategory: 'oot',
                racetimeGoal: 'Bingo',
            });
            (getAccessToken as jest.Mock).mockResolvedValueOnce(
                'mock-access-token',
            );
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
            });

            const result = await handleRacetimeAction(
                mockRoom,
                'create',
                'user1',
                monitorToken,
            );
            expect(result).toEqual({
                code: 400,
                message: 'Invalid racetime configuration for the category',
            });
        });

        it('500 when the startrace response status is not 201', async () => {
            (getRacetimeConfiguration as jest.Mock).mockResolvedValueOnce({
                racetimeCategory: 'oot',
                racetimeGoal: 'Bingo',
            });
            (getAccessToken as jest.Mock).mockResolvedValueOnce(
                'mock-access-token',
            );
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
            });

            const result = await handleRacetimeAction(
                mockRoom,
                'create',
                'user1',
                monitorToken,
            );
            expect(result.code).toBe(500);
        });

        it('500 when the Location header is missing', async () => {
            (getRacetimeConfiguration as jest.Mock).mockResolvedValueOnce({
                racetimeCategory: 'oot',
                racetimeGoal: 'Bingo',
            });
            (getAccessToken as jest.Mock).mockResolvedValueOnce(
                'mock-access-token',
            );
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 201,
                headers: {
                    get: jest.fn().mockReturnValue(null),
                },
            });

            const result = await handleRacetimeAction(
                mockRoom,
                'create',
                'user1',
                monitorToken,
            );
            expect(result.code).toBe(500);
        });

        it('200 with the race URL after successful creation', async () => {
            (getRacetimeConfiguration as jest.Mock).mockResolvedValueOnce({
                racetimeCategory: 'oot',
                racetimeGoal: 'Bingo',
            });
            (getAccessToken as jest.Mock).mockResolvedValueOnce(
                'mock-access-token',
            );
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 201,
                headers: {
                    get: jest.fn().mockReturnValue('/oot/race-123'),
                },
            });

            const result = await handleRacetimeAction(
                mockRoom,
                'create',
                'user1',
                monitorToken,
            );
            expect(result.code).toBe(200);
            expect('value' in result && result.value).toEqual({
                url: expect.stringContaining('/oot/race-123'),
            });
            expect(connectRoomToRacetime).toHaveBeenCalledWith(
                'test-room-slug',
                expect.stringContaining('/oot/race-123'),
            );
            expect(mockRoom.handleRacetimeRoomCreated).toHaveBeenCalled();
        });
    });

    describe('action: refresh', () => {
        it('200 and refreshes the racetime handler', async () => {
            const result = await handleRacetimeAction(
                mockRoom,
                'refresh',
                'user1',
                playerToken,
            );
            expect(result).toEqual({ code: 200, value: {} });
            expect(mockRoom.refreshRacetimeHandler).toHaveBeenCalled();
        });
    });

    describe('action: join', () => {
        it('403 when roomToken.isSpectating is true', async () => {
            const result = await handleRacetimeAction(
                mockRoom,
                'join',
                'user1',
                spectatorToken,
            );
            expect(result).toEqual({ code: 403, message: 'Forbidden' });
        });

        it('403 when room.joinRaceRoom returns false', async () => {
            (mockRoom.joinRaceRoom as jest.Mock).mockReturnValueOnce(false);
            const result = await handleRacetimeAction(
                mockRoom,
                'join',
                'user1',
                playerToken,
            );
            expect(result).toEqual({ code: 403, message: 'Forbidden' });
        });

        it('200 when room.joinRaceRoom returns true', async () => {
            (mockRoom.joinRaceRoom as jest.Mock).mockReturnValueOnce(true);
            const result = await handleRacetimeAction(
                mockRoom,
                'join',
                'user1',
                playerToken,
            );
            expect(result).toEqual({ code: 200, value: {} });
            expect(mockRoom.joinRaceRoom).toHaveBeenCalledWith(
                'rt-user-1',
                playerToken,
            );
        });
    });

    describe('action: ready', () => {
        it('403 when roomToken.isSpectating is true', async () => {
            const result = await handleRacetimeAction(
                mockRoom,
                'ready',
                'user1',
                spectatorToken,
            );
            expect(result).toEqual({ code: 403, message: 'Forbidden' });
        });

        it('403 when room.readyPlayer returns false', async () => {
            (mockRoom.readyPlayer as jest.Mock).mockReturnValueOnce(false);
            const result = await handleRacetimeAction(
                mockRoom,
                'ready',
                'user1',
                playerToken,
            );
            expect(result).toEqual({ code: 403, message: 'Forbidden' });
        });

        it('200 when room.readyPlayer returns true', async () => {
            (mockRoom.readyPlayer as jest.Mock).mockReturnValueOnce(true);
            const result = await handleRacetimeAction(
                mockRoom,
                'ready',
                'user1',
                playerToken,
            );
            expect(result).toEqual({ code: 200, value: {} });
            expect(mockRoom.readyPlayer).toHaveBeenCalledWith(playerToken);
        });
    });

    describe('action: unready', () => {
        it('403 when roomToken.isSpectating is true', async () => {
            const result = await handleRacetimeAction(
                mockRoom,
                'unready',
                'user1',
                spectatorToken,
            );
            expect(result).toEqual({ code: 403, message: 'Forbidden' });
        });

        it('403 when room.unreadyPlayer returns false', async () => {
            (mockRoom.unreadyPlayer as jest.Mock).mockReturnValueOnce(false);
            const result = await handleRacetimeAction(
                mockRoom,
                'unready',
                'user1',
                playerToken,
            );
            expect(result).toEqual({ code: 403, message: 'Forbidden' });
        });

        it('200 when room.unreadyPlayer returns true', async () => {
            (mockRoom.unreadyPlayer as jest.Mock).mockReturnValueOnce(true);
            const result = await handleRacetimeAction(
                mockRoom,
                'unready',
                'user1',
                playerToken,
            );
            expect(result).toEqual({ code: 200, value: {} });
            expect(mockRoom.unreadyPlayer).toHaveBeenCalledWith(playerToken);
        });
    });

    describe('unknown action', () => {
        it('400 with Unknown action when action name is unrecognized', async () => {
            const result = await handleRacetimeAction(
                mockRoom,
                'invalid-action',
                'user1',
                playerToken,
            );
            expect(result).toEqual({ code: 400, message: 'Unknown action' });
        });
    });
});
