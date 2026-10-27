import { Counter, Gauge, Histogram } from 'prom-client';
import type Room from '../core/Room';
import { registry } from './metrics';

export const roomsTotal = new Gauge({
    name: 'rooms_total',
    help: 'Current number of active rooms',
    registers: [registry],
});

const roomPlayers = new Gauge({
    name: 'room_players',
    help: 'Number of players associated with active rooms',
    labelNames: ['role'],
    registers: [registry],
});

const roomPlayersConnected = new Gauge({
    name: 'room_players_connected',
    help: 'Number of players currently connected to active rooms',
    labelNames: ['role'],
    registers: [registry],
});

const roomCompleted = new Gauge({
    name: 'room_completed',
    help: 'Number of active rooms that are complete',
    registers: [registry],
});

// Aggregate across rooms: room IDs and user-defined configuration would create
// new Prometheus series throughout the lifetime of the service.
export const observeRooms = (rooms: Iterable<Room>) => {
    const activeRooms = Array.from(rooms);
    roomsTotal.set(activeRooms.length);
    roomCompleted.set(activeRooms.filter((room) => room.completed).length);

    const players = { player: 0, spectator: 0 };
    const connectedPlayers = { player: 0, spectator: 0 };
    activeRooms.forEach((room) => {
        room.players.forEach((player) => {
            const role = player.spectator ? 'spectator' : 'player';
            players[role]++;
            if (player.hasConnections()) {
                connectedPlayers[role]++;
            }
        });
    });

    (['player', 'spectator'] as const).forEach((role) => {
        roomPlayers.set({ role }, players[role]);
        roomPlayersConnected.set({ role }, connectedPlayers[role]);
    });
};

const roomsCreated = new Counter({
    name: 'rooms_created_total',
    help: 'New rooms successfully activated',
    registers: [registry],
});

const roomsRestored = new Counter({
    name: 'rooms_restored_total',
    help: 'Persisted rooms successfully restored into memory',
    registers: [registry],
});

const roomsClosed = new Counter({
    name: 'rooms_closed_total',
    help: 'Rooms unloaded from memory by reason',
    labelNames: ['reason'],
    registers: [registry],
});

const residenceDuration = new Histogram({
    name: 'room_residence_duration_seconds',
    help: 'Time a room remained loaded in this process',
    buckets: [60, 300, 900, 1800, 3600, 7200, 21600, 86400],
    registers: [registry],
});

const roundsCompleted = new Counter({
    name: 'room_rounds_completed_total',
    help: 'First completion of a board round by all participating players',
    registers: [registry],
});

const residences = new WeakMap<
    Room,
    ReturnType<typeof residenceDuration.startTimer>
>();

export const roomActivated = (room: Room, source: 'created' | 'restored') => {
    if (residences.has(room)) return;
    (source === 'created' ? roomsCreated : roomsRestored).inc();
    residences.set(room, residenceDuration.startTimer());
};

export type RoomCloseReason = 'inactivity' | 'empty' | 'shutdown';

export const roomClosed = (room: Room, reason: RoomCloseReason) => {
    const stopTimer = residences.get(room);
    if (!stopTimer) return;
    residences.delete(room);
    roomsClosed.inc({ reason });
    stopTimer();
};

export const roundCompleted = () => roundsCompleted.inc();
