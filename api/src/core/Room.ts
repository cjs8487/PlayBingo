import { GeneratorSettings } from '@playbingo/shared';
import { randomUUID } from 'node:crypto';
import {
    ChangeColorAction,
    ChangeRaceHandlerAction,
    ChatAction,
    ChatMessage,
    JoinAction,
    LeaveAction,
    MarkAction,
    NewCardAction,
    Player as PlayerData,
    Team as TeamData,
    RevealedCell,
    ServerMessage,
    UnmarkAction,
    SetChatEnabledAction,
    JoinTeamAction,
    SetTeamsEnabledAction,
} from '@playbingo/types';
import { BingoMode } from '@prisma/client';
import { DateTime } from 'luxon';
import { WebSocket } from 'ws';
import { roomCleanupInactive } from '../Environment';
import { logDebug, logError, logInfo, logWarn } from '../Logger';
import {
    invalidateToken,
    Permissions,
    RoomTokenPayload,
} from '../auth/RoomAuth';
import {
    addChangeColorAction,
    addChatAction,
    addJoinAction,
    addLeaveAction,
    addMarkAction,
    addUnmarkAction,
    createUpdatePlayer,
    createUpdateTeam,
    setRoomBoard,
    updateRaceHandler,
    updateTeamsEnabled,
} from '../database/Rooms';
import { isStaff } from '../database/Users';
import {
    getDifficultyGroupCount,
    getDifficultyVariant,
    isModerator,
    useTypedRandom,
} from '../database/games/Games';
import { getCategories } from '../database/games/GoalCategories';
import { goalsForGameFull } from '../database/games/Goals';
import { shuffle } from '../util/Array';
import {
    computeLineMasks,
    getModeString,
    listToBoard,
    rowColToMask,
} from '../util/RoomUtils';
import Player from './Player';
import { allRooms } from './RoomServer';
import { BoardGenerator } from './generation/BoardGenerator';
import {
    GeneratorGoal,
    GlobalGenerationState,
} from './generation/GeneratorCore';
import { generateFullRandom, generateRandomTyped } from './generation/Random';
import { generateSRLv5 } from './generation/SRLv5';
import LocalTimer from './integration/races/LocalTimer';
import RaceHandler from './integration/races/RaceHandler';
import RacetimeHandler, { RaceData } from './integration/races/RacetimeHandler';
import Team from './Team';

export type HiddenCell = {
    revealed: false;
    completedTeams: string[];
};

export enum BoardGenerationMode {
    RANDOM = 'Random',
    SRLv5 = 'SRLv5',
    DIFFICULTY = 'Difficulty',
}

interface BoardGenerationOptionsBase {
    mode: BoardGenerationMode;
    seed?: number;
}

interface BoardGenerationOptionsRandom extends BoardGenerationOptionsBase {
    mode: BoardGenerationMode.RANDOM;
}

interface BoardGenerationOptionsSRLv5 extends BoardGenerationOptionsBase {
    mode: BoardGenerationMode.SRLv5;
}

interface BoardGenerationOptionsDifficulty extends BoardGenerationOptionsBase {
    mode: BoardGenerationMode.DIFFICULTY;
    difficulty: string;
}

export type BoardGenerationOptions =
    | BoardGenerationOptionsRandom
    | BoardGenerationOptionsSRLv5
    | BoardGenerationOptionsDifficulty;

/**
 * Represents a room in the PlayBingo service. A room is container for a single
 * "game" of bingo, containing the board, game state, history, and all other
 * game level data.
 */
export default class Room {
    name: string;
    game: string;
    gameSlug: string;
    password: string;
    slug: string;
    board: RevealedCell[][];
    chatHistory: ChatMessage[];
    id: string;
    hideCard: boolean;
    bingoMode: BingoMode;
    lineCount: number;
    variantName: string;
    exploration: boolean = false;
    alwaysRevealedMask: bigint = 0n;
    seed: number;
    teamsEnabled: boolean;
    chatEnabled: boolean = true;

    lastGenerationMode: BoardGenerationOptions;

    victoryMasks: bigint[];
    completed: boolean;

    generatorSettings?: GeneratorSettings;
    newGenerator: boolean;

    racetimeEligible: boolean;
    raceHandler: RaceHandler;

    lastMessage: number;

    inactivityWarningTimeout?: NodeJS.Timeout;
    closeTimeout?: NodeJS.Timeout;

    teams: Map<string, Team>;
    spectators: Map<string, Player>;

    constructor(
        name: string,
        game: string,
        gameSlug: string,
        slug: string,
        password: string,
        id: string,
        hideCard: boolean,
        bingoMode: BingoMode,
        lineCount: number,
        racetimeEligible: boolean,
        variantName: string,
        seed: number,
        explorationStart?: string,
        racetimeUrl?: string,
        generatorSettings?: GeneratorSettings,
        teamsEnabled: boolean = false,
    ) {
        this.name = name;
        this.game = game;
        this.gameSlug = gameSlug;
        this.password = password;
        this.slug = slug;
        this.chatHistory = [];
        this.id = id;
        this.bingoMode = bingoMode;
        this.lineCount = lineCount;
        this.variantName = variantName;

        this.lastGenerationMode = { mode: BoardGenerationMode.RANDOM };

        this.racetimeEligible = !!racetimeEligible;
        if (this.racetimeEligible) {
            this.raceHandler = new RacetimeHandler(this);
        } else {
            this.raceHandler = new LocalTimer(this);
        }

        this.board = [];

        if (racetimeUrl) {
            this.raceHandler.connect(racetimeUrl);
        }

        this.victoryMasks = [];

        this.hideCard = hideCard;
        this.completed = false;

        this.generatorSettings = generatorSettings;
        this.newGenerator = !!generatorSettings;

        this.lastMessage = Date.now();
        this.inactivityWarningTimeout = setTimeout(
            () => this.warnClose(),
            roomCleanupInactive,
        );

        this.teams = new Map<string, Team>();
        this.spectators = new Map<string, Player>();

        this.seed = seed;
        this.teamsEnabled = teamsEnabled;

        if (explorationStart) {
            this.exploration = true;
            switch (explorationStart) {
                case 'TL':
                    this.alwaysRevealedMask |= rowColToMask(0, 0, 5);
                    break;
                case 'TR':
                    this.alwaysRevealedMask |= rowColToMask(0, 4, 5);
                    break;
                case 'BL':
                    this.alwaysRevealedMask |= rowColToMask(4, 0, 5);
                    break;
                case 'BR':
                    this.alwaysRevealedMask |= rowColToMask(4, 4, 5);
                    break;
                case 'CENTER':
                    this.alwaysRevealedMask |= rowColToMask(2, 2, 5);
                    break;
                default:
                    const startCount = Number(explorationStart);
                    if (isNaN(startCount)) {
                        this.logWarn(
                            'Unknown starting square for exploration. Exploration was not enabled for this room.',
                        );
                        this.exploration = false;
                    }
                    const cells = [...Array(25).keys()];
                    shuffle(cells);
                    for (let i = 0; i < startCount; i++) {
                        const cell = cells.pop();
                        if (!cell) {
                            return;
                        }
                        this.alwaysRevealedMask |= rowColToMask(
                            cell % 5,
                            Math.floor(cell / 5),
                            5,
                        );
                    }
            }
        }
    }

    getAllPlayers(): Player[] {
        const players = this.teams
            .values()
            .flatMap((team) => team.players.values());
        return [...this.spectators.values(), ...players];
    }

    getPlayerById(playerId: string): Player | undefined {
        return this.getAllPlayers().find((player) => player.id === playerId);
    }

    getPlayerDisplayName(player: Player, team?: Team): string {
        return this.teamsEnabled && team ? team.name : player.nickname;
    }

    getTeamDisplayName(team: Team): string {
        if (this.teamsEnabled) {
            return team.name;
        }
        return team.players.values().next().value?.nickname ?? team.name;
    }

    deleteTeam(teamId: string) {
        this.teams.get(teamId)?.destroy();
        this.teams.delete(teamId);
    }

    spectatorObfuscateBoard(): (RevealedCell | HiddenCell)[][] {
        let exploredGoals = 0n;
        this.teams.forEach((team) => {
            exploredGoals |= team.getRevealedMask();
        });
        return this.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
                const mask = rowColToMask(
                    rowIndex,
                    colIndex,
                    this.board[0].length,
                );
                return (exploredGoals & mask) !== 0n
                    ? ({
                          revealed: true,
                          goal: cell.goal,
                          completedTeams: cell.completedTeams,
                      } as RevealedCell)
                    : ({
                          revealed: false,
                          completedTeams: cell.completedTeams,
                      } as HiddenCell);
            }),
        );
    }

    async generateBoard(options: BoardGenerationOptions) {
        this.lastGenerationMode = options;
        const { mode, seed } = options;
        const goals = await goalsForGameFull(this.gameSlug);
        let goalList: GeneratorGoal[];
        const categories = await getCategories(this.gameSlug);
        const categoryMaxes: { [k: string]: number } = {};
        categories.forEach((cat) => {
            categoryMaxes[cat.name] = cat.max <= 0 ? -1 : cat.max;
        });

        // generator config was passed in when the room was initialized, so the
        // game is enabled and configured for the new generator system
        // difficulty variants are mutually exclusive with th new generator
        // system currently, so if difficulty is selected go back to the old one
        if (this.generatorSettings && mode !== BoardGenerationMode.DIFFICULTY) {
            const generator = new BoardGenerator(
                goals,
                categories,
                this.generatorSettings,
            );
            generator.reset(options.seed);
            generator.generateBoard();
            this.seed = generator.seed;
            this.board = generator.board.map((row) =>
                row.map((goal) => ({
                    goal: goal,
                    completedTeams: [],
                    revealed: true,
                })),
            );
            this.computeVictoryMasks();
        } else {
            const globalState: GlobalGenerationState = {
                useCategoryMaxes: categories.some((cat) => cat.max > 0),
                categoryMaxes,
            };
            try {
                switch (mode) {
                    case BoardGenerationMode.SRLv5:
                        goalList = generateSRLv5(goals, globalState, seed);
                        goalList.shift();
                        break;
                    case BoardGenerationMode.DIFFICULTY:
                        const { difficulty } = options;
                        const variant = await getDifficultyVariant(difficulty);
                        const numGroups = await getDifficultyGroupCount(
                            this.gameSlug,
                        );

                        if (!numGroups || !variant) {
                            this.logError(
                                'Invalid game configuration for difficulty variants',
                            );
                            throw new Error();
                        }

                        const maxDifficulty = goals.reduce<number>(
                            (max, goal) => {
                                if (goal.difficulty && goal.difficulty > max) {
                                    return goal.difficulty;
                                }
                                return max;
                            },
                            0,
                        );
                        const groupSize = maxDifficulty / numGroups;
                        const emptyGroupedGoals = [];
                        for (let i = 0; i < numGroups; i++) {
                            emptyGroupedGoals.push([]);
                        }
                        const groupedGoals = goals.reduce<GeneratorGoal[][]>(
                            (curr, goal) => {
                                if (goal.difficulty && goal.difficulty > 0) {
                                    const grpIdx = Math.floor(
                                        (goal.difficulty - 1) / groupSize,
                                    );
                                    if (grpIdx < numGroups) {
                                        curr[grpIdx].push(goal);
                                    }
                                }
                                return curr;
                            },
                            emptyGroupedGoals,
                        );
                        goalList = [];
                        groupedGoals.forEach((group, index) => {
                            shuffle(group);
                            const toAdd = group.splice(
                                0,
                                variant.goalAmounts[index],
                            );
                            goalList.push(...toAdd);
                        });

                        if (goalList.length !== 25) {
                            this.logError(
                                'Difficulty variant generation produced an invalid goal list',
                            );
                            throw new Error();
                        }
                        shuffle(goalList, seed);
                        break;
                    case BoardGenerationMode.RANDOM:
                        if (await useTypedRandom(this.game)) {
                            goalList = generateRandomTyped(goals, seed);
                            goalList.shift();
                        } else {
                            goalList = generateFullRandom(goals, seed);
                        }
                        break;
                    default:
                        goalList = generateFullRandom(goals, seed);
                        break;
                }
            } catch (e) {
                this.logError(`Failed to generate board ${e}`);
                return;
            }
            this.board = listToBoard(goalList, 5);
        }

        // reset board aware state
        this.teams.values().forEach((team) => {
            team.markedGoals = 0n;
            team.goalCount = 0;
            team.goalComplete = false;
            team.linesComplete = 0;
            team.exploredGoals = 0n;
            team.players.forEach((player) => {
                player.finishedAt = undefined;
            });
        });
        this.raceHandler.resetTimer();

        this.sendSyncBoard();
        setRoomBoard(
            this.id,
            this.board.flat().map((cell) => cell.goal.id),
        );
    }

    getPlayerData(): { teams: TeamData[]; spectators: PlayerData[] } {
        const teams: TeamData[] = [];
        this.teams.forEach((team) => teams.push(team.toClientData()));
        const spectators: PlayerData[] = [];
        this.spectators.forEach((spectator) =>
            spectators.push(spectator.toClientData()),
        );
        return { teams, spectators };
    }

    getTeamForPlayer(playerId: string): Team | undefined {
        for (const team of this.teams.values()) {
            if (team.players.has(playerId)) {
                return team;
            }
        }
        return undefined;
    }

    //#region Handlers
    handleJoin(
        action: JoinAction,
        auth: RoomTokenPayload,
        socket: WebSocket,
    ): ServerMessage {
        let player = this.getPlayerById(auth.playerId);
        let playerTeam = auth.isSpectating
            ? undefined
            : player
              ? this.getTeamForPlayer(player.id)
              : undefined;
        let newPlayer = false;
        if (!player && action.payload) {
            const teamId = auth.isSpectating ? undefined : randomUUID();
            if (!auth.isSpectating) {
                playerTeam = new Team(
                    this,
                    teamId!,
                    `Team ${action.payload.nickname}`,
                    'blue',
                );
                player = new Player(
                    this,
                    auth.playerId,
                    action.payload.nickname,
                    auth.isMonitor,
                    playerTeam.obfuscateBoard,
                    teamId,
                    auth.userId,
                );
                playerTeam.addPlayer(player);
                this.teams.set(playerTeam!.id, playerTeam!);
            } else {
                player = new Player(
                    this,
                    auth.playerId,
                    action.payload.nickname,
                    auth.isMonitor,
                    this.spectatorObfuscateBoard,
                    teamId,
                    auth.userId,
                );
                this.spectators.set(auth.playerId, player);
            }
            newPlayer = true;
        }

        // I don't think this is necessary anymore, but I'm mainly putting it here for type safety
        if (!player || (!auth.isSpectating && !playerTeam)) {
            return { action: 'unauthorized' };
        }

        const timestamp = new Date();
        if (newPlayer) {
            if (auth.isSpectating) {
                this.sendChat(
                    `${player.nickname} is now spectating`,
                    timestamp,
                );
            } else {
                this.sendChat(
                    [
                        { contents: player.nickname, color: playerTeam!.color },
                        ` has joined playing for ${playerTeam!.name}.`,
                    ],
                    timestamp,
                );
            }
        }

        player.addConnection(auth.uuid, socket);
        addJoinAction(this.id, player.nickname, timestamp).then();
        if (playerTeam) {
            createUpdateTeam(this.id, playerTeam).then();
        }
        createUpdatePlayer(this.id, player).then();
        return {
            action: 'connected',
            board: {
                width: this.board[0].length,
                height: this.board.length,
                ...(this.hideCard
                    ? { hidden: true }
                    : {
                          hidden: false,
                          board: this.exploration
                              ? player.getBoardView()
                              : this.board,
                      }),
            },
            chatHistory: this.chatHistory,
            connectedPlayer: player.toClientData(),
            roomData: {
                game: this.game,
                slug: this.slug,
                name: this.name,
                gameSlug: this.gameSlug,
                newGenerator: this.newGenerator,
                seed: this.seed,
                racetimeConnection: this.raceHandler
                    ? 'url' in this.raceHandler
                        ? {
                              gameActive: this.racetimeEligible,
                              url: (this.raceHandler as RacetimeHandler).url,
                              startDelay: (this.raceHandler as RacetimeHandler)
                                  .data?.start_delay,
                              status: (this.raceHandler as RacetimeHandler).data
                                  ?.status.verbose_value,
                          }
                        : undefined
                    : { gameActive: this.racetimeEligible, url: undefined },
                mode: getModeString(this.bingoMode, this.lineCount),
                variant: this.variantName,
                teamsEnabled: this.teamsEnabled,
                startedAt: this.raceHandler?.getStartTime(),
                finishedAt: this.raceHandler?.getEndTime(),
                raceHandler: this.raceHandler?.key(),
            },
            players: this.getPlayerData(),
        };
    }

    handleJoinTeam(
        action: JoinTeamAction,
        auth: RoomTokenPayload,
    ): ServerMessage {
        if (!this.teamsEnabled) {
            return { action: 'forbidden' };
        }
        const player = this.getPlayerById(auth.playerId);
        if (!player) {
            return { action: 'unauthorized' };
        }
        const team = this.teams.get(action.payload.teamId);
        if (!team) {
            return { action: 'unauthorized' };
        }
        const oldTeam = this.getTeamForPlayer(player.id);
        if (oldTeam) {
            oldTeam.removePlayer(player.id);
            if (oldTeam.players.size === 0) {
                oldTeam.destroy();
                this.teams.delete(oldTeam.id);
            }
        } else {
            // player was spectator before
            this.spectators.delete(player.id);
        }
        player.teamId = team.id;
        team.addPlayer(player);
        createUpdatePlayer(this.id, player).then();
        if (oldTeam) {
            createUpdateTeam(this.id, oldTeam).then();
        }
        if (team) {
            createUpdateTeam(this.id, team).then();
        }
        this.sendChat(
            [
                {
                    contents: player.nickname,
                    color: team.color,
                },
                ` joined ${team.name}`,
            ],
            new Date(),
        );
        return {
            action: 'joinedTeam',
            team: team.toClientData(),
        };
    }

    handleLeave(
        action: LeaveAction,
        auth: RoomTokenPayload,
        token: string,
    ): ServerMessage {
        let player: Player | undefined = undefined;
        for (const p of this.getAllPlayers()) {
            if (p.closeConnection(auth.uuid)) {
                player = p;
                break;
            }
        }
        if (!player) {
            return { action: 'unauthorized' };
        }
        const hasLeft = !player.hasConnections();
        const timestamp = new Date();
        if (hasLeft) {
            const playerTeam = this.getTeamForPlayer(player.id);
            if (playerTeam) {
                playerTeam.removePlayer(player.id);
                if (playerTeam.players.size === 0) {
                    playerTeam.destroy();
                    this.teams.delete(playerTeam.id);
                }
                this.sendChat(
                    [
                        { contents: player.nickname, color: playerTeam.color },
                        ' has left.',
                    ],
                    timestamp,
                );
            } else {
                this.sendChat(`${player.nickname} has left.`, timestamp);
            }
            addLeaveAction(this.id, player.nickname, timestamp).then();
            if (this.getAllPlayers().length === 0) {
                this.close();
            }
        }
        invalidateToken(token);
        return { action: 'disconnected' };
    }

    handleChat(
        action: ChatAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const player = this.getAllPlayers().find((p) => p.id === auth.playerId);
        if (!player) {
            return { action: 'unauthorized' };
        }
        const { message: chatMessage } = action.payload;
        if (!chatMessage) return;
        const timestamp = new Date();
        this.sendChat(`${player.nickname}: ${chatMessage}`, timestamp);
        addChatAction(this.id, player.nickname, chatMessage, timestamp).then();
    }

    handleMark(
        action: MarkAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const team = this.getTeamForPlayer(auth.playerId);
        const player = team?.players.get(auth.playerId);
        if (!team || !player) {
            return { action: 'unauthorized' };
        }
        const { row, col } = action.payload;
        if (row === undefined || col === undefined) return;
        if (team.hasMarked(row, col)) return;

        if (
            this.bingoMode === BingoMode.LOCKOUT &&
            this.board[row][col].completedTeams.length > 0
        )
            return;
        this.board[row][col].completedTeams.push(team.id);
        this.board[row][col].completedTeams.sort((a, b) => a.localeCompare(b));
        team.mark(row, col);
        this.sendCellUpdate(row, col);
        const timestamp = new Date();
        this.sendChat(
            [
                {
                    contents: this.getPlayerDisplayName(player, team),
                    color: team.color,
                },
                ` marked ${this.board[row][col].goal.goal} (${row},${col})`,
            ],
            timestamp,
        );
        addMarkAction(this.id, player.id, row, col, timestamp).then();
        this.checkWinConditions();
    }

    handleUnmark(
        action: UnmarkAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const team = this.getTeamForPlayer(auth.playerId);
        const player = team?.players.get(auth.playerId);
        if (!team || !player) {
            return { action: 'unauthorized' };
        }
        const { row: unRow, col: unCol } = action.payload;
        if (unRow === undefined || unCol === undefined) return;
        if (!team.hasMarked(unRow, unCol)) return;
        this.board[unRow][unCol].completedTeams = this.board[unRow][
            unCol
        ].completedTeams.filter((teamId) => teamId !== team.id);
        team.unmark(unRow, unCol);
        this.sendCellUpdate(unRow, unCol);
        const timestamp = new Date();
        this.sendChat(
            [
                {
                    contents: this.getPlayerDisplayName(player, team),
                    color: team.color,
                },
                ` unmarked ${this.board[unRow][unCol].goal.goal} (${unRow},${unCol})`,
            ],
            timestamp,
        );
        addUnmarkAction(this.id, player.id, unRow, unCol, timestamp).then();
        this.checkWinConditions();
    }

    handleChangeColor(
        action: ChangeColorAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const player = this.getPlayerById(auth.playerId);
        if (!player) {
            return { action: 'unauthorized' };
        }
        const { color } = action.payload;
        if (!color) {
            return;
        }
        const team = this.getTeamForPlayer(player.id);
        if (!team) {
            return { action: 'unauthorized' };
        }
        const timestamp = new Date();
        addChangeColorAction(
            this.id,
            team.name,
            team.color,
            color,
            timestamp,
        ).then();
        team.color = color;
        createUpdateTeam(this.id, team).then();
        this.sendChat(
            [
                { contents: this.getTeamDisplayName(team), color: team.color },
                ' has changed their color to ',
                { contents: color, color },
            ],
            timestamp,
        );
    }

    handleNewCard(action: NewCardAction) {
        if (action.options) {
            const options = action.options;
            if (!options.mode) {
                options.mode = this.lastGenerationMode.mode;
            }
            this.generateBoard(options as BoardGenerationOptions);
        } else {
            // TODO: we should probably generate a new seed before generating
            // the board from the previous settings
            this.generateBoard(this.lastGenerationMode);
        }
    }

    handleStartTimer() {
        this.raceHandler?.startTimer();
        this.sendRoomData();
    }

    handleChangeRaceHandler(action: ChangeRaceHandlerAction) {
        if (this.raceHandler) {
            this.raceHandler.disconnect();
        }
        switch (action.raceHandler) {
            case 'local':
                this.raceHandler = new LocalTimer(this);
                break;
            case 'racetime':
                this.raceHandler = new RacetimeHandler(this);
                break;
        }
        this.sendRoomData();
        updateRaceHandler(this.id, this.raceHandler.key()).then();
    }

    handleResetTimer() {
        this.raceHandler?.resetTimer();
        this.sendRoomData();
    }

    handleSocketClose(ws: WebSocket) {
        let player: Player | undefined;
        for (const p of this.getAllPlayers()) {
            if (p.handleSocketClose(ws)) {
                player = p;
            }
        }
        const timestamp = new Date();
        if (player) {
            if (!player.hasConnections()) {
                const team = this.getTeamForPlayer(player.id);
                if (team) {
                    this.sendChat(
                        [
                            { contents: player.nickname, color: team.color },
                            ' has left.',
                        ],
                        timestamp,
                    );
                } else {
                    this.sendChat(`${player.nickname} has left.`, timestamp);
                }
                addLeaveAction(this.id, player.nickname, timestamp).then();
                if (this.getAllPlayers().length === 0) {
                    this.close();
                }
            }
            return true;
        }
        return false;
    }

    async handleRacetimeRoomCreated(url: string) {
        this.sendServerMessage({
            action: 'updateRoomData',
            roomData: {
                game: this.game,
                slug: this.slug,
                name: this.name,
                gameSlug: this.gameSlug,
                seed: this.seed,
                racetimeConnection: {
                    url,
                },
                newGenerator: this.newGenerator,
                mode: getModeString(this.bingoMode, this.lineCount),
                variant: this.variantName,
                teamsEnabled: this.teamsEnabled,
                raceHandler: this.raceHandler?.key(),
            },
        });
        this.sendChat(`Racetime.gg room created ${url}`, new Date());
        this.raceHandler.connect(url);
        (this.raceHandler as RacetimeHandler).connectWebsocket();
    }

    handleRacetimeRoomDisconnected() {
        this.raceHandler.disconnect();
        this.sendServerMessage({
            action: 'updateRoomData',
            roomData: {
                game: this.game,
                slug: this.slug,
                name: this.name,
                gameSlug: this.gameSlug,
                seed: this.seed,
                racetimeConnection: {
                    url: undefined,
                },
                newGenerator: this.newGenerator,
                mode: getModeString(this.bingoMode, this.lineCount),
                variant: this.variantName,
                teamsEnabled: this.teamsEnabled,
                raceHandler: this.raceHandler?.key(),
            },
        });
    }

    handleRevealCard(payload: RoomTokenPayload) {
        const player = this.getPlayerById(payload.playerId);
        if (!player) {
            return null;
        }
        this.revealCardForPlayer(player);
    }

    handleSetChatEnabled(action: SetChatEnabledAction) {
        this.chatEnabled = action.payload.enabled;
        this.sendRoomData();
    }

    handleSetTeamsEnabled(action: SetTeamsEnabledAction) {
        this.teamsEnabled = action.payload.enabled;
        updateTeamsEnabled(this.id, this.teamsEnabled).then();
        this.sendRoomData();
    }
    //#endregion

    private getTimestamp(timestamp: Date) {
        if (this.raceHandler) {
            const startTime = this.raceHandler.getStartTime();
            if (startTime) {
                const start = DateTime.fromISO(startTime);
                const now = DateTime.fromJSDate(timestamp);
                const dur = now.diff(start);
                if (dur.toMillis() < 0) {
                    return '0:00:00';
                }
                return dur.shiftToAll().toFormat('h:mm:ss');
            }
            return '0:00:00';
        }
        return '';
    }

    //#region Send Messages
    sendChat(message: string, timestamp: Date): void;
    sendChat(message: ChatMessage, timestamp: Date): void;

    sendChat(message: string | ChatMessage, eventTimestamp: Date) {
        if (!this.chatEnabled) {
            return;
        }
        if (typeof message === 'string') {
            const timestamp = this.getTimestamp(eventTimestamp);
            if (timestamp) {
                this.chatHistory.push([
                    `[${this.getTimestamp(eventTimestamp)}] ${message}`,
                ]);
            } else {
                this.chatHistory.push([message]);
            }
            this.sendServerMessage({ action: 'chat', message: [message] });
        } else {
            const timestamp = this.getTimestamp(eventTimestamp);
            if (timestamp) {
                message.unshift(`[${this.getTimestamp(eventTimestamp)}] `);
            }
            this.chatHistory.push(message);
            this.sendServerMessage({ action: 'chat', message: message });
        }
    }

    sendSystemMessage(message: string) {
        const timestamp = this.getTimestamp(new Date());
        if (timestamp) {
            this.chatHistory.push([`[${timestamp}] ${message}`]);
        } else {
            this.chatHistory.push([message]);
        }
        this.sendServerMessage({ action: 'chat', message: [message] }, false);
    }

    sendCellUpdate(row: number, col: number) {
        this.sendServerMessage({
            action: 'cellUpdate',
            row,
            col,
            cell: this.board[row][col],
        });
    }

    sendSyncBoard() {
        this.sendServerMessage({
            action: 'syncBoard',
            board: {
                width: this.board[0].length,
                height: this.board.length,
                ...(this.hideCard
                    ? { hidden: true }
                    : { hidden: false, board: this.board }),
            },
        });
    }

    sendRaceData(data: RaceData) {
        this.logInfo('Dispatching race data update');
        this.sendServerMessage({
            action: 'syncRaceData',
            players: this.getPlayerData(),
            racetimeConnection: {
                gameActive: this.racetimeEligible,
                url: (this.raceHandler as RacetimeHandler).url,
                startDelay: data.start_delay ?? undefined,
                status: data.status.verbose_value,
            },
        });
        this.sendRoomData();
    }

    sendRoomData() {
        this.sendServerMessage({
            action: 'updateRoomData',
            roomData: {
                game: this.game,
                slug: this.slug,
                name: this.name,
                gameSlug: this.gameSlug,
                racetimeConnection:
                    'url' in this.raceHandler
                        ? {
                              gameActive: this.racetimeEligible,
                              url: (this.raceHandler as RacetimeHandler).url,
                              startDelay:
                                  (this.raceHandler as RacetimeHandler).data
                                      ?.start_delay ?? undefined,
                              status: (this.raceHandler as RacetimeHandler).data
                                  ?.status.verbose_value,
                          }
                        : undefined,
                newGenerator: this.newGenerator,
                mode: getModeString(this.bingoMode, this.lineCount),
                variant: this.variantName,
                seed: this.seed,
                teamsEnabled: this.teamsEnabled,
                startedAt: this.raceHandler?.getStartTime(),
                finishedAt: this.raceHandler?.getEndTime(),
                raceHandler: this.raceHandler?.key(),
                chatEnabled: this.chatEnabled,
            },
        });
    }

    private sendServerMessage(
        message: ServerMessage,
        updateInactivity: boolean = true,
    ) {
        this.getAllPlayers().forEach((player) => {
            player.sendMessage({ ...message, players: this.getPlayerData() });
        });

        if (updateInactivity) {
            this.lastMessage = Date.now();
            this.inactivityWarningTimeout?.refresh();
            clearTimeout(this.closeTimeout);
            this.closeTimeout = undefined;
        }
    }

    private checkWinConditions() {
        const timestamp = new Date();
        this.teams.forEach((team) => {
            if (this.bingoMode === BingoMode.LOCKOUT) {
                const goalsNeeded = Math.ceil(
                    (this.board.length * this.board[0].length) / 2,
                );
                if (!team.goalComplete && team.goalCount >= goalsNeeded) {
                    this.sendChat(
                        [
                            {
                                contents: team.name,
                                // TODO: Which color should this be?
                                color: 'white',
                            },
                            ' has achieved lockout!',
                        ],
                        timestamp,
                    );
                    team.goalComplete = true;
                    team.players.values().forEach((player) => {
                        this.raceHandler?.playerFinished(player);
                    });
                }
                if (team.goalComplete && team.goalCount < goalsNeeded) {
                    this.sendChat(
                        [
                            {
                                contents: team.name,
                                // TODO: Which color should this be?
                                color: 'white',
                            },
                            ' no longer has lockout.',
                        ],
                        timestamp,
                    );
                    team.goalComplete = false;
                    team.players.values().forEach((player) => {
                        this.raceHandler?.playerUnfinshed(player);
                    });
                }
            } else {
                if (this.bingoMode === BingoMode.LINES) {
                    const linesComplete = this.victoryMasks.reduce(
                        (count, mask) =>
                            count + (team.hasCompletedGoals(mask) ? 1 : 0),
                        0,
                    );
                    if (linesComplete > team.linesComplete) {
                        this.sendChat(
                            [
                                {
                                    contents: team.name,
                                    // TODO: Which color should this be?
                                    color: 'white',
                                },
                                ' has completed a line!',
                            ],
                            timestamp,
                        );
                    }
                    if (linesComplete >= this.lineCount && !team.goalComplete) {
                        team.goalComplete = true;
                        team.players.values().forEach((player) => {
                            this.raceHandler?.playerFinished(player).then();
                        });
                        this.sendChat(
                            [
                                {
                                    contents: team.name,
                                    color: 'white',
                                },
                                ' has completed the goal!',
                            ],
                            timestamp,
                        );
                    } else if (
                        linesComplete < this.lineCount &&
                        team.goalComplete
                    ) {
                        team.goalComplete = false;
                        team.players.values().forEach((player) => {
                            this.raceHandler?.playerUnfinshed(player).then();
                        });
                        this.sendChat(
                            [
                                {
                                    contents: team.name,
                                    color: 'white',
                                },
                                ' has no longer completed the goal.',
                            ],
                            timestamp,
                        );
                    }
                    team.linesComplete = linesComplete;
                } else {
                    const complete = this.victoryMasks.every((mask) =>
                        team.hasCompletedGoals(mask),
                    );
                    if (complete && !team.goalComplete) {
                        team.goalComplete = true;
                        team.players.values().forEach((player) => {
                            this.raceHandler?.playerFinished(player);
                        });
                        this.sendChat(
                            [
                                {
                                    contents: team.name,
                                    color: 'white',
                                },
                                ' has achieved blackout!',
                            ],
                            timestamp,
                        );
                    } else if (!complete && team.goalComplete) {
                        team.goalComplete = false;
                        team.players.values().forEach((player) => {
                            this.raceHandler?.playerUnfinshed(player);
                        });
                        this.sendChat(
                            [
                                {
                                    contents: team.name,
                                    color: 'white',
                                },
                                ' no longer has blackout.',
                            ],
                            timestamp,
                        );
                    }
                }
            }
        });
        let allComplete = true;
        this.teams.forEach((team) => {
            if (!team.goalComplete) {
                allComplete = false;
            }
        });
        this.completed = allComplete;
        if (this.completed) {
            this.raceHandler?.allPlayersFinished();
            this.sendRoomData();
        } else {
            if (this.raceHandler?.getEndTime()) {
                this.raceHandler?.allPlayersNotFinished();
                this.sendRoomData();
            }
        }
    }

    /**
     * Determines if authentication is required in order to access the room.
     * Staff and category moderators are always allowed to access rooms, though
     * they will need to provide the password in order to elevate from spectator
     * permissions.
     *
     * Players who have previously successfully authenticated within their
     * session context are also eligible for auto authentication, pulling
     * permissions from their previous connection.
     *
     * @param user The id of the currently logged in user
     * @returns False if authentication is required in order to grant the
     * provided user minimal room permissions, or a Permissions object
     * containing he appropriate permissions based on the user
     */
    async canAutoAuthenticate(
        user: string,
        isSession: boolean,
    ): Promise<false | Permissions> {
        if (!user) {
            return false;
        }

        const player = this.getAllPlayers().find(
            (p) => p.id === `${isSession ? 'session' : 'user'}:${user}`,
        );
        if (player) {
            return {
                isMonitor: player.monitor,
                isSpectating: this.spectators.has(player.id),
            };
        }

        if (await isModerator(this.gameSlug, user)) {
            this.logInfo(
                `${user} is being automatically authenticated as a room monitor due to being a game moderator or owner.`,
            );
            return { isMonitor: true, isSpectating: true };
        }

        if (await isStaff(user)) {
            this.logInfo(
                `${user} is being automatically authenticated as a room monitor due to being a member of PlayBingo staff.`,
            );
            return { isMonitor: true, isSpectating: true };
        }

        return false;
    }

    //#region Racetime Integration
    async connectRacetimeWebSocket() {
        (this.raceHandler as RacetimeHandler).connectWebsocket();
    }

    joinRaceRoom(racetimeId: string, authToken: RoomTokenPayload) {
        const player = this.getAllPlayers().find(
            (p) => p.id === authToken.playerId,
        );
        if (!player) {
            this.logWarn('Unable to find a player for a verified room token');
            return false;
        }
        this.logInfo(`Connecting ${player.nickname} to racetime`);
        return player.joinRace();
    }

    leaveRaceRoom(authToken: RoomTokenPayload) {
        const player = this.getAllPlayers().find(
            (p) => p.id === authToken.playerId,
        );
        if (!player) {
            this.logWarn('Unable to find a player for a verified room token');
            return false;
        }
        this.logInfo(`Leaving ${player.nickname} from racetime`);
        return player.leaveRace();
    }

    async refreshRacetimeHandler() {
        this.raceHandler.refresh();
    }

    readyPlayer(roomAuth: RoomTokenPayload) {
        const player = this.getAllPlayers().find(
            (p) => p.id === roomAuth.playerId,
        );
        if (!player) {
            this.logWarn('Unable to find a player for a verified room token');
            return false;
        }
        this.logInfo(`Readying ${player.nickname} to race`);
        return player.ready();
    }

    unreadyPlayer(roomAuth: RoomTokenPayload) {
        const player = this.getAllPlayers().find(
            (p) => p.id === roomAuth.playerId,
        );
        if (!player) {
            this.logWarn(
                'Unable to find an identity for a verified room token',
            );
            return false;
        }
        this.logInfo(`Readying ${player.nickname} to race`);
        return player.unready();
    }
    //#endregion

    //#region Logging
    logDebug(message: string, metadata?: { [k: string]: string }) {
        logDebug(message, { room: this.slug, ...metadata });
    }

    logInfo(message: string, metadata?: { [k: string]: string }) {
        logInfo(message, { room: this.slug, ...metadata });
    }

    logWarn(message: string, metadata?: { [k: string]: string }) {
        logWarn(message, { room: this.slug, ...metadata });
    }

    logError(message: string, metadata?: { [k: string]: string }) {
        logError(message, { room: this.slug, ...metadata });
    }
    //#endregion

    //#region Utilities
    warnClose() {
        this.logInfo('Sending inactivity warning.');
        this.sendSystemMessage(
            'This room close in 5 minutes if no activity is detected.',
        );
        this.closeTimeout = setTimeout(this.close.bind(this), 5 * 60 * 1000);
    }

    /**
     * Determines if this room can be closed, which removes it from working memory because the room is no longer being
     * used.
     * @returns true if the room can be closed.
     */
    canClose() {
        if (Date.now() - this.lastMessage > roomCleanupInactive) {
            return this.getAllPlayers().length <= 0;
        }
        return false;
    }

    /**
     * Runs room level cleanup tasks and closes all open connections to the room
     */
    close() {
        this.logInfo('Closing room.');
        this.sendSystemMessage('This room has been closed due to inactivity.');
        this.getAllPlayers().forEach((player) => {
            player.connections.forEach((connection) => {
                this.handleSocketClose(connection);
                connection.close(1001, 'Room is closing.');
            });
        });
        allRooms.delete(this.slug);
    }

    revealCardForPlayer(player: Player) {
        const team = this.getTeamForPlayer(player.id);
        const timestamp = new Date();
        if (team) {
            this.sendChat(
                [
                    { contents: player.nickname, color: team.color },
                    ' has revealed the card.',
                ],
                timestamp,
            );
        } else {
            this.sendChat(
                `${player.nickname} has revealed the card.`,
                timestamp,
            );
        }
        player.sendMessage({
            action: 'syncBoard',
            board: {
                hidden: false,
                board: this.board,
                width: this.board[0].length,
                height: this.board.length,
            },
        });
    }

    revealCardForAllPlayers() {
        this.getAllPlayers().forEach((player) => {
            this.revealCardForPlayer(player);
        });
    }

    computeVictoryMasks() {
        const width = this.board[0].length;
        const height = this.board.length;
        if (this.bingoMode === BingoMode.LINES) {
            this.victoryMasks = computeLineMasks(height, width);
        } else if (this.bingoMode === BingoMode.BLACKOUT) {
            let mask = 0n;
            for (let i = 0; i < width * height; i++) {
                mask |= 1n << BigInt(i);
            }
            this.victoryMasks = [mask];
        } else {
            this.victoryMasks = [];
        }
    }
    //#endregion
}
