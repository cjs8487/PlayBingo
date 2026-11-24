import { ConnectionService } from '@prisma/client';
import { getConnectionForUser } from '../database/Connections';
import { getAccessToken } from '../lib/RacetimeConnector';
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
    getRacetimeConfiguration,
    useTypedRandom,
} from '../database/games/Games';
import { getCategories } from '../database/games/GoalCategories';
import { goalsForGameFull } from '../database/games/Goals';
import Room, { BoardGenerationMode } from './Room';
import type Player from './Player';
import type { RoomEvents } from './Room';

const roomListeners = new Map<string, () => void>();
const roomQueueTails = new Map<
    string,
    { result: Promise<unknown>; settled: Promise<void> }
>();

function enqueue<T>(room: Room, operation: () => Promise<T>): Promise<T> {
    const roomId = room.id;
    const previous = roomQueueTails.get(roomId)?.settled ?? Promise.resolve();
    const result = previous.then(operation);

    const settle = async () => {
        try {
            await result;
        } catch (error) {
            room.logError(`Failed to process room database event - ${error}`);
        } finally {
            if (roomQueueTails.get(roomId)?.result === result) {
                roomQueueTails.delete(roomId);
            }
        }
    };
    roomQueueTails.set(roomId, { result, settled: settle() });
    return result;
}

/** Drain queued work before detaching the database listeners. */
export async function shutdownRoomDatabaseListeners(): Promise<void> {
    while (roomQueueTails.size > 0) {
        await Promise.all(
            Array.from(roomQueueTails.values(), (entry) => entry.settled),
        );
    }
    for (const roomId of roomListeners.keys()) {
        unsubscribe(roomId);
    }
}

export function subscribe(room: Room): void {
    if (roomListeners.has(room.id)) {
        return;
    }

    const onClose = () => unsubscribe(room.id);
    // Capture state before queuing so rapid actions retain their original order.
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
        enqueue(room, async () => {
            if (teamState) await createUpdateTeam(room.id, teamState);
            await createUpdatePlayer(room.id, playerState);
        });
    };
    const onTeamRenamed: RoomEvents['team:renamed'] = (_player, team) => {
        const { id, name, color } = team;
        enqueue(room, () => createUpdateTeam(room.id, { id, name, color }));
    };
    const onRaceStarted: RoomEvents['race:startChanged'] = (value) => {
        enqueue(room, () =>
            updateStartTime(room.id, value ? new Date(value) : null),
        );
    };
    const onRaceFinished: RoomEvents['race:finishChanged'] = (value) => {
        enqueue(room, () =>
            updateFinishTime(room.id, value ? new Date(value) : null),
        );
    };
    const onRaceHandlerChanged: RoomEvents['race:handlerChanged'] = (
        handler,
    ) => {
        enqueue(room, () => updateRaceHandler(room.id, handler));
    };
    const onTeamsEnabledChanged: RoomEvents['room:teamsEnabledChanged'] = (
        enabled,
    ) => {
        enqueue(room, () => updateTeamsEnabled(room.id, enabled));
    };
    const onRacetimeIdentityRequested: RoomEvents['racetime:identityRequested'] =
        (userId, supply) => {
            supply(
                getConnectionForUser(userId, ConnectionService.RACETIME).then(
                    (connection) => connection?.serviceId,
                ),
            );
        };
    const onRacetimeCreationInputsRequested: RoomEvents['racetime:creationInputsRequested'] =
        (userId, supply) => {
            supply(
                enqueue(room, async () => {
                    const configuration = await getRacetimeConfiguration(
                        room.gameSlug,
                    );
                    if (!configuration) return undefined;
                    const { racetimeCategory: category, racetimeGoal: goal } =
                        configuration;
                    const token =
                        category && goal
                            ? await getAccessToken(userId)
                            : undefined;
                    return { category, goal, token };
                }),
            );
        };
    const onRacetimeCreated: RoomEvents['racetime:connectionRequested'] = (
        url,
    ) => {
        enqueue(room, () => connectRoomToRacetime(room.slug, url));
    };
    const onRacetimeDisconnected = () => {
        enqueue(room, () => disconnectRoomFromRacetime(room.slug));
    };
    const onPlayerConnected: RoomEvents['player:connected'] = (
        player,
        newPlayer,
        timestamp,
    ) => {
        const { id, nickname, teamId } = player;
        const announcement =
            room.chatEnabled && newPlayer
                ? room.createPlayerAnnouncement(
                      player,
                      { action: 'players:join' },
                      timestamp,
                  )
                : null;
        enqueue(room, () =>
            addJoinAction(
                room.id,
                id,
                nickname,
                teamId,
                timestamp,
                announcement,
            ),
        );
        writePlayer(player);
    };
    const onPlayersLeave: RoomEvents['players:leave'] = (player, timestamp) => {
        const { id, nickname, teamId } = player;
        const announcement = room.chatEnabled
            ? room.createPlayerAnnouncement(
                  player,
                  { action: 'players:leave' },
                  timestamp,
              )
            : null;
        enqueue(room, () =>
            addLeaveAction(
                room.id,
                id,
                nickname,
                teamId,
                timestamp,
                announcement,
            ),
        );
    };
    const onPlayerChat: RoomEvents['player:chat'] = (
        player,
        message,
        timestamp,
    ) => {
        const { id, nickname } = player;
        const announcement = room.chatEnabled
            ? room.createPlayerAnnouncement(
                  player,
                  { action: 'player:chat', message },
                  timestamp,
              )
            : null;
        enqueue(room, () =>
            addChatAction(
                room.id,
                id,
                nickname,
                message,
                timestamp,
                announcement,
            ),
        );
    };
    const onBoardGoalMarked: RoomEvents['board:goalMarked'] = (
        cell,
        row,
        col,
        player,
        timestamp,
    ) => {
        const { id, teamId } = player;
        if (!teamId) return;
        const announcement = room.chatEnabled
            ? room.createPlayerAnnouncement(
                  player,
                  {
                      action: 'board:goalMarked',
                      row,
                      col,
                      goal: cell.revealed ? cell.goal.goal : undefined,
                  },
                  timestamp,
              )
            : null;
        enqueue(room, () =>
            addMarkAction(
                room.id,
                id,
                teamId,
                row,
                col,
                timestamp,
                announcement,
            ),
        );
    };
    const onBoardGoalUnmarked: RoomEvents['board:goalUnmarked'] = (
        cell,
        row,
        col,
        player,
        timestamp,
    ) => {
        const { id, teamId } = player;
        if (!teamId) return;
        const announcement = room.chatEnabled
            ? room.createPlayerAnnouncement(
                  player,
                  {
                      action: 'board:goalUnmarked',
                      row,
                      col,
                      goal: cell.revealed ? cell.goal.goal : undefined,
                  },
                  timestamp,
              )
            : null;
        enqueue(room, () =>
            addUnmarkAction(
                room.id,
                id,
                teamId,
                row,
                col,
                timestamp,
                announcement,
            ),
        );
    };
    const onBoardGenerationRequested: RoomEvents['board:generationRequested'] =
        (options, supply) => {
            const slug = room.gameSlug;
            const newGenerator = room.newGenerator;
            supply(
                enqueue(room, async () => {
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
                        !newGenerator &&
                        (await useTypedRandom(slug));
                    return { goals, categories, typedRandom };
                }),
            );
        };
    const onBoardRegenerated: RoomEvents['board:regenerated'] = (
        board,
        _options,
        timestamp,
    ) => {
        const goalIds = board.flat().map((cell) => cell.goal.id);
        const { boardWidth, boardHeight } = room;
        enqueue(room, () =>
            setRoomBoard(room.id, goalIds, boardWidth, boardHeight, timestamp),
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
            const playerId = player.id;
            enqueue(room, () => createUpdateTeam(room.id, { id, name, color }));
            enqueue(room, () =>
                addChangeColorAction(
                    room.id,
                    playerId,
                    id,
                    name,
                    oldColor,
                    color,
                    timestamp,
                    room.chatEnabled
                        ? room.createPlayerAnnouncement(
                              player,
                              {
                                  action: 'player:colorChanged',
                                  newColor: color,
                              },
                              timestamp,
                          )
                        : null,
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
    room.on('racetime:identityRequested', onRacetimeIdentityRequested);
    room.on(
        'racetime:creationInputsRequested',
        onRacetimeCreationInputsRequested,
    );
    room.on('racetime:connectionRequested', onRacetimeCreated);
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
        room.off('racetime:identityRequested', onRacetimeIdentityRequested);
        room.off(
            'racetime:creationInputsRequested',
            onRacetimeCreationInputsRequested,
        );
        room.off('racetime:connectionRequested', onRacetimeCreated);
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

export function getSubscribedRooms(): string[] {
    return Array.from(roomListeners.keys());
}

export function isSubscribed(roomId: string): boolean {
    return roomListeners.has(roomId);
}
