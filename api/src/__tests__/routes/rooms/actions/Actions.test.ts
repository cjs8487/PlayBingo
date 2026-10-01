import Room from '../../../../core/Room';
import {
    handleAction,
    unknownAction,
} from '../../../../routes/rooms/actions/Actions';
import { handleRacetimeAction } from '../../../../routes/rooms/actions/RacetimeActions';
import { RoomTokenPayload } from '../../../../auth/RoomAuth';

jest.mock('../../../../routes/rooms/actions/RacetimeActions', () => ({
    handleRacetimeAction: jest.fn(),
}));

describe('Actions', () => {
    let mockRoom: Room;
    const mockToken: RoomTokenPayload = {
        roomSlug: 'test-room-slug',
        uuid: 'test-uuid',
        playerId: 'player-1',
        isMonitor: true,
        isSpectating: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockRoom = {
            logInfo: jest.fn(),
            logWarn: jest.fn(),
            logError: jest.fn(),
        } as unknown as Room;
    });

    it('200 from handleRacetimeAction for racetime actions', async () => {
        (handleRacetimeAction as jest.Mock).mockResolvedValueOnce({
            code: 200,
            value: { url: 'https://racetime.gg' },
        });

        const result = await handleAction(
            mockRoom,
            'racetime/create',
            'test-user',
            mockToken,
        );

        expect(handleRacetimeAction).toHaveBeenCalledWith(
            mockRoom,
            'create',
            'test-user',
            mockToken,
        );
        expect(result).toEqual({
            code: 200,
            value: { url: 'https://racetime.gg' },
        });
    });

    it('400 for an unhandled action module', async () => {
        const result = await handleAction(
            mockRoom,
            'unknown-module/action',
            'test-user',
            mockToken,
        );

        expect(result).toEqual({ code: 400, message: 'Unknown action' });
        expect(mockRoom.logInfo).toHaveBeenCalledWith('Unknown action request');
    });

    it('400 with Unknown action from unknownAction', () => {
        const res = unknownAction(mockRoom);
        expect(res).toEqual({ code: 400, message: 'Unknown action' });
        expect(mockRoom.logInfo).toHaveBeenCalledWith('Unknown action request');
    });
});
