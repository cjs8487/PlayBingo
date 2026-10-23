import { Gauge } from 'prom-client';
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
