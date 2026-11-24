import {
    addChangeColorAction,
    addChatAction,
    addJoinAction,
    addLeaveAction,
    addMarkAction,
    addUnmarkAction,
    setRoomBoard,
    createUpdatePlayer,
    createUpdateTeam,
    updateStartTime,
    updateFinishTime,
    updateRaceHandler,
    updateTeamsEnabled,
    connectRoomToRacetime,
    disconnectRoomFromRacetime,
} from '../database/Rooms';
import {
    getDifficultyGroupCount,
    getDifficultyVariant,
    useTypedRandom,
} from '../database/games/Games';
import { getCategories } from '../database/games/GoalCategories';
import { goalsForGameFull } from '../database/games/Goals';
import Room, { BoardGenerationMode } from './Room';
import type Player from './Player';
import type { RoomEvents } from './Room';

const roomListeners = new Map<string, () => void>();

export function subscribe(room: Room): void {
    if (roomListeners.has(room.id)) {
        return;
    }

    const onClose = () => unsubscribe(room.id);
    // Capture state before queuing so rapid actions retain their original order.
    let pendingStateWrite: Promise<unknown> | undefined;
    const writeState = (write: () => Promise<unknown>) => {
        const operation = pendingStateWrite
            ? pendingStateWrite.then(write)
            : write();
        const settled = operation.catch((error) =>
            room.logError(`Failed to persist room state - ${error}`),
        );
        pendingStateWrite = settled;
        void settled.then(() => {
            if (pendingStateWrite === settled) pendingStateWrite = undefined;
        });
        return operation;
    };
    const writePlayer = (player: Player) => {
        const { id, nickname, teamId, userId, monitor, finishedAt } = player;
        const playerState = {
            id,
            nickname,
            teamId,
            userId,
            monitor,
            finishedAt,
        };
        const team = teamId ? room.teams.get(teamId) : undefined;
        const teamState = team && {
            id: team.id,
            name: team.name,
            color: team.color,
        };
        writeState(async () => {
            if (teamState) await createUpdateTeam(room.id, teamState);
            await createUpdatePlayer(room.id, playerState);
        });
    };
    const onTeamRenamed: RoomEvents['team:renamed'] = (_player, team) => {
        const { id, name, color } = team;
        writeState(() => createUpdateTeam(room.id, { id, name, color }));
    };
    const onRaceStarted: RoomEvents['race:startChanged'] = (value) => {
        writeState(() =>
            updateStartTime(room.id, value ? new Date(value) : null),
        );
    };
    const onRaceFinished: RoomEvents['race:finishChanged'] = (value) => {
        writeState(() =>
            updateFinishTime(room.id, value ? new Date(value) : null),
        );
    };
    const onRaceHandlerChanged: RoomEvents['race:handlerChanged'] = (
        handler,
    ) => {
        writeState(() => updateRaceHandler(room.id, handler));
    };
    const onTeamsEnabledChanged: RoomEvents['room:teamsEnabledChanged'] = (
        enabled,
    ) => {
        writeState(() => updateTeamsEnabled(room.id, enabled));
    };
    const onRacetimeCreated: RoomEvents['racetime:created'] = (
        url,
        persist,
    ) => {
        persist(writeState(() => connectRoomToRacetime(room.slug, url)));
    };
    const onRacetimeDisconnected = () => {
        writeState(() => disconnectRoomFromRacetime(room.slug));
    };
    const onPlayerConnected: RoomEvents['player:connected'] = (
        player,
        timestamp,
    ) => {
        persistAction(
            room,
            addJoinAction(
                room.id,
                player.id,
                player.nickname,
                player.teamId,
                timestamp,
            ),
        );
        writePlayer(player);
    };
    const onPlayersLeave: RoomEvents['players:leave'] = (player, timestamp) => {
        persistAction(
            room,
            addLeaveAction(
                room.id,
                player.id,
                player.nickname,
                player.teamId,
                timestamp,
            ),
        );
    };
    const onPlayerChat: RoomEvents['player:chat'] = (
        player,
        message,
        timestamp,
    ) => {
        persistAction(
            room,
            addChatAction(
                room.id,
                player.id,
                player.nickname,
                message,
                timestamp,
            ),
        );
    };
    const onBoardGoalMarked: RoomEvents['board:goalMarked'] = (
        _cell,
        row,
        col,
        player,
        timestamp,
    ) => {
        if (player.teamId) {
            persistAction(
                room,
                addMarkAction(
                    room.id,
                    player.id,
                    player.teamId,
                    row,
                    col,
                    timestamp,
                ),
            );
        }
    };
    const onBoardGoalUnmarked: RoomEvents['board:goalUnmarked'] = (
        _cell,
        row,
        col,
        player,
        timestamp,
    ) => {
        if (player.teamId) {
            persistAction(
                room,
                addUnmarkAction(
                    room.id,
                    player.id,
                    player.teamId,
                    row,
                    col,
                    timestamp,
                ),
            );
        }
    };
    const onBoardGenerationRequested: RoomEvents['board:generationRequested'] =
        (options, supply) => {
            const slug = room.gameSlug;
            supply(
                (async () => {
                    const [goals, categories] = await Promise.all([
                        goalsForGameFull(slug),
                        getCategories(slug),
                    ]);
                    if (options.mode === BoardGenerationMode.DIFFICULTY) {
                        const [groups, variant] = await Promise.all([
                            getDifficultyGroupCount(slug),
                            getDifficultyVariant(options.difficulty),
                        ]);
                        return {
                            goals,
                            categories,
                            difficulty: {
                                groups,
                                goalAmounts: variant?.goalAmounts,
                            },
                        };
                    }
                    const typedRandom =
                        options.mode === BoardGenerationMode.RANDOM &&
                        !room.newGenerator &&
                        (await useTypedRandom(slug));
                    return { goals, categories, typedRandom };
                })(),
            );
        };
    const onBoardRegenerated: RoomEvents['board:regenerated'] = (
        board,
        _options,
        _timestamp,
        persist,
    ) => {
        persist?.(
            setRoomBoard(
                room.id,
                board.flat().map((cell) => cell.goal.id),
                room.boardWidth,
                room.boardHeight,
            ),
        );
    };
    const onColorChanged: RoomEvents['player:colorChanged'] = (
        player,
        color,
        oldColor,
        timestamp,
    ) => {
        const team = room.getTeamForPlayer(player.id);
        if (team) {
            const { id, name } = team;
            writeState(() => createUpdateTeam(room.id, { id, name, color }));
            persistAction(
                room,
                addChangeColorAction(
                    room.id,
                    player.id,
                    team.id,
                    team.name,
                    oldColor,
                    color,
                    timestamp,
                ),
            );
        }
    };
    room.on('player:membershipChanged', writePlayer);
    room.on('team:renamed', onTeamRenamed);
    room.on('race:playerChanged', writePlayer);
    room.on('race:startChanged', onRaceStarted);
    room.on('race:finishChanged', onRaceFinished);
    room.on('race:handlerChanged', onRaceHandlerChanged);
    room.on('room:teamsEnabledChanged', onTeamsEnabledChanged);
    room.on('racetime:created', onRacetimeCreated);
    room.on('racetime:disconnected', onRacetimeDisconnected);
    room.on('player:colorChanged', onColorChanged);
    room.on('player:connected', onPlayerConnected);
    room.on('players:leave', onPlayersLeave);
    room.on('player:chat', onPlayerChat);
    room.on('board:goalMarked', onBoardGoalMarked);
    room.on('board:goalUnmarked', onBoardGoalUnmarked);
    room.on('board:generationRequested', onBoardGenerationRequested);
    room.on('board:regenerated', onBoardRegenerated);
    room.once('room:closed', onClose);
    roomListeners.set(room.id, () => {
        room.off('player:membershipChanged', writePlayer);
        room.off('team:renamed', onTeamRenamed);
        room.off('race:playerChanged', writePlayer);
        room.off('race:startChanged', onRaceStarted);
        room.off('race:finishChanged', onRaceFinished);
        room.off('race:handlerChanged', onRaceHandlerChanged);
        room.off('room:teamsEnabledChanged', onTeamsEnabledChanged);
        room.off('racetime:created', onRacetimeCreated);
        room.off('racetime:disconnected', onRacetimeDisconnected);
        room.off('player:colorChanged', onColorChanged);
        room.off('player:connected', onPlayerConnected);
        room.off('players:leave', onPlayersLeave);
        room.off('player:chat', onPlayerChat);
        room.off('board:goalMarked', onBoardGoalMarked);
        room.off('board:goalUnmarked', onBoardGoalUnmarked);
        room.off('board:generationRequested', onBoardGenerationRequested);
        room.off('board:regenerated', onBoardRegenerated);
        room.off('room:closed', onClose);
    });
}

export function unsubscribe(roomId: string): void {
    roomListeners.get(roomId)?.();
    roomListeners.delete(roomId);
}

function persistAction(room: Room, operation: Promise<unknown>) {
    operation.catch((error) =>
        room.logError(`Failed to persist room event - ${error}`),
    );
}

export function getSubscribedRooms(): string[] {
    return Array.from(roomListeners.keys());
}

export function isSubscribed(roomId: string): boolean {
    return roomListeners.has(roomId);
}
