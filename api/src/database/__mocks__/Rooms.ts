import { BingoMode, Game, Player, Room } from '@prisma/client';
import { mock } from 'jest-mock-extended';

export const mockGame = mock<Game>();
mockGame.name = 'Zelda';
mockGame.slug = 'zelda';
mockGame.newGeneratorBeta = false;

export const mockPlayer = mock<Player>();
mockPlayer.key = 'p1';
mockPlayer.nickname = 'Player 1';
mockPlayer.color = 'red';
mockPlayer.spectator = false;
mockPlayer.monitor = false;

export const mockRoom = mock<
    Room & { game: Game; players: Player[]; history: any[] }
>();
mockRoom.id = 'r1';
mockRoom.slug = 'room-1';
mockRoom.name = 'Room 1';
mockRoom.variantId = 'v1';
mockRoom.game = mockGame;
mockRoom.bingoMode = BingoMode.LINES;
mockRoom.board = Array(25)
    .fill(0)
    .map((_, i) => `${i + 1}`);
mockRoom.players = [mockPlayer];
mockRoom.history = [];

export const getRoomFromSlug = jest.fn(async (slug: string) => {
    if (!slug || slug === 'non-existent' || slug === 'unknown') {
        return null;
    }
    return mockRoom;
});

export const getFullRoomList = jest.fn(async () => []);
export const getAllRooms = jest.fn(async () => []);
export const createRoom = jest.fn(async (slug: string, name: string) => ({
    ...mockRoom,
    slug,
    name,
}));
export const addJoinAction = jest.fn();
export const addLeaveAction = jest.fn();
export const addMarkAction = jest.fn();
export const addUnmarkAction = jest.fn();
export const addChatAction = jest.fn();
export const addChangeColorAction = jest.fn();
export const connectRoomToRacetime = jest.fn(
    async (slug: string, racetimeRoom: string) => mockRoom,
);
export const disconnectRoomFromRacetime = jest.fn(
    async (slug: string) => mockRoom,
);
export const setRoomBoard = jest.fn(
    async (id: string, board: any) => undefined,
);
export const createUpdatePlayer = jest.fn(
    async (room: string, player: any) => mockPlayer,
);
