import { GeneratorSettings } from '@playbingo/shared';
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
} from '@playbingo/types';
import { BingoMode } from '@prisma/client';
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
    setRoomBoard,
    updateRaceHandler,
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
    completedPlayers: string[];
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

    // players: Map<string, Player>;
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
                          completedPlayers: cell.completedPlayers,
                      } as RevealedCell)
                    : ({
                          revealed: false,
                          completedPlayers: cell.completedPlayers,
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
                    completedPlayers: [],
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

        this.sendSyncBoard();
        setRoomBoard(
            this.id,
            this.board.flat().map((cell) => cell.goal.id),
        );
    }

    getPlayers(): { teams: TeamData[]; spectators: PlayerData[] } {
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
        let player: Player | undefined;
        let playerTeam: Team | undefined;
        let newPlayer = false;
        let playerIsAuthed = false;
        if (!auth.isSpectating) {
            this.teams.forEach((team) => {
                if (team.players.has(auth.playerId)) {
                    playerIsAuthed = true;
                    playerTeam = team;
                    player = team.players.get(auth.playerId);
                }
            });
        } else {
            player = this.spectators.get(auth.playerId);
            if (player) {
                playerIsAuthed = true;
            }
        }
        if (playerIsAuthed) {
            if (!player) {
                return { action: 'unauthorized' };
            }
        } else if (action.payload) {
            player = new Player(
                this,
                auth.playerId,
                action.payload.nickname,
                undefined,
                auth.isMonitor,
                auth.isSpectating
                    ? () => this.spectatorObfuscateBoard()
                    : () => playerTeam!.obfuscateBoard(),
                auth.userId,
            );
            if (auth.isSpectating) {
                this.spectators.set(auth.playerId, player);
            } else {
                if (auth.teamId && this.teams.get(auth.teamId)) {
                    playerTeam = this.teams.get(auth.teamId);
                } else {
                    playerTeam = new Team(
                        this,
                        '',
                        `Team ${action.payload.nickname}`,
                    );
                }
                playerTeam!.addPlayer(player);
            }
            newPlayer = true;
        } else {
            if (!playerIsAuthed) {
                return { action: 'unauthorized' };
            }
        }

        // I don't think this is necessary anymore, but I'm mainly putting it here for type safety
        if (!player || (!auth.isSpectating && !playerTeam)) {
            return { action: 'unauthorized' };
        }

        if (newPlayer) {
            if (auth.isSpectating) {
                this.sendChat(`${player.nickname} is now spectating`);
            } else {
                this.sendChat([
                    { contents: player.nickname, color: player.color },
                    ` has joined playing for ${playerTeam!.name}.`,
                ]);
            }
        }

        player.addConnection(auth.uuid, socket);
        addJoinAction(this.id, player.nickname, player.color).then();
        createUpdatePlayer(this.id, player, auth.isSpectating).then();
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
                startedAt: this.raceHandler?.getStartTime(),
                finishedAt: this.raceHandler?.getEndTime(),
                raceHandler: this.raceHandler?.key(),
            },
            players: this.getPlayers(),
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
        if (hasLeft) {
            const playerTeam = this.getTeamForPlayer(player.id);
            if (playerTeam) {
                playerTeam.removePlayer(player.id);
                if (playerTeam.players.size === 0) {
                    playerTeam.destroy();
                    this.teams.delete(playerTeam.id);
                }
            }
            this.sendChat([
                { contents: player.nickname, color: player.color },
                ' has left.',
            ]);
            addLeaveAction(this.id, player.nickname, player.color).then();
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
        const player = this.getAllPlayers().find(
            (p) => p.id === auth.playerId,
        );
        if (!player) {
            return { action: 'unauthorized' };
        }
        const { message: chatMessage } = action.payload;
        if (!chatMessage) return;
        this.sendChat(`${player.nickname}: ${chatMessage}`);
        addChatAction(
            this.id,
            player.nickname,
            player.color,
            chatMessage,
        ).then();
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
            this.board[row][col].completedPlayers.length > 0
        )
            return;
        this.board[row][col].completedPlayers.push(player.id);
        this.board[row][col].completedPlayers.sort((a, b) =>
            a.localeCompare(b),
        );
        team.mark(row, col);
        this.sendCellUpdate(row, col);
        this.sendChat([
            {
                contents: team.players.size > 1 ? team.name : player.nickname,
                color: player.color,
            },
            ` marked ${this.board[row][col].goal.goal} (${row},${col})`,
        ]);
        addMarkAction(this.id, player.id, row, col).then();
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
        this.board[unRow][unCol].completedPlayers = this.board[unRow][
            unCol
        ].completedPlayers.filter((playerId) => playerId !== player.id);
        team.unmark(unRow, unCol);
        this.sendCellUpdate(unRow, unCol);
        this.sendChat([
            { contents: team.players.size > 1 ? team.name : player.nickname, color: player.color },
            ` unmarked ${this.board[unRow][unCol].goal.goal} (${unRow},${unCol})`,
        ]);
        addUnmarkAction(this.id, player.id, unRow, unCol).then();
        this.checkWinConditions();
    }

    handleChangeColor(
        action: ChangeColorAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const player = this.getAllPlayers().find(p => p.id === auth.playerId);
        if (!player) {
            return { action: 'unauthorized' };
        }
        const { color } = action.payload;
        if (!color) {
            return;
        }
        addChangeColorAction(
            this.id,
            player.nickname,
            player.color,
            color,
        ).then();
        player.color = color;
        createUpdatePlayer(this.id, player, false).then();
        this.sendChat([
            { contents: player.nickname, color: player.color },
            ' has changed their color to ',
            { contents: color, color },
        ]);
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
        if (player) {
            if (!player.hasConnections()) {
                this.sendChat([
                    { contents: player.nickname, color: player.color },
                    ' has left.',
                ]);
                addLeaveAction(this.id, player.nickname, player.color).then();
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
                raceHandler: this.raceHandler?.key(),
            },
        });
        this.sendChat(`Racetime.gg room created ${url}`);
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
                raceHandler: this.raceHandler?.key(),
            },
        });
    }

    handleRevealCard(payload: RoomTokenPayload) {
        const player = this.getAllPlayers().find(p => p.id === payload.playerId);
        if (!player) {
            return null;
        }
        this.revealCardForPlayer(player);
    }

    handleSetChatEnabled(action: SetChatEnabledAction) {
        this.chatEnabled = action.payload.enabled;
        this.sendRoomData();
    }
    //#endregion

    //#region Send Messages
    sendChat(message: string): void;
    sendChat(message: ChatMessage): void;

    sendChat(message: string | ChatMessage) {
        if (!this.chatEnabled) {
            return;
        }
        if (typeof message === 'string') {
            this.chatHistory.push([message]);
            this.sendServerMessage({ action: 'chat', message: [message] });
        } else {
            this.chatHistory.push(message);
            this.sendServerMessage({ action: 'chat', message: message });
        }
    }

    sendSystemMessage(message: string) {
        this.chatHistory.push([message]);
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
            players: this.getPlayers(),
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
            player.sendMessage({ ...message, players: this.getPlayers() });
        });

        if (updateInactivity) {
            this.lastMessage = Date.now();
            this.inactivityWarningTimeout?.refresh();
            clearTimeout(this.closeTimeout);
            this.closeTimeout = undefined;
        }
    }

    private checkWinConditions() {
        this.teams.forEach((team) => {
            if (this.bingoMode === BingoMode.LOCKOUT) {
                const goalsNeeded = Math.ceil(
                    (this.board.length * this.board[0].length) / 2,
                );
                if (!team.goalComplete && team.goalCount >= goalsNeeded) {
                    this.sendChat([
                        {
                            contents: team.name,
                            // TODO: Which color should this be?
                            color: 'white',
                        },
                        ' has achieved lockout!',
                    ]);
                    team.goalComplete = true;
                    team.players.values().forEach((player) => {
                        this.raceHandler?.playerFinished(player);
                    })
                }
                if (team.goalComplete && team.goalCount < goalsNeeded) {
                    this.sendChat([
                        {
                            contents: team.name,
                            // TODO: Which color should this be?
                            color: 'white',
                        },
                        ' no longer has lockout.',
                    ]);
                    team.goalComplete = false;
                    team.players.values().forEach((player) => {
                        this.raceHandler?.playerUnfinshed(player);
                    })
                }
            } else {
                if (this.bingoMode === BingoMode.LINES) {
                    const linesComplete = this.victoryMasks.reduce(
                        (count, mask) =>
                            count + (team.hasCompletedGoals(mask) ? 1 : 0),
                        0,
                    );
                    if (linesComplete > team.linesComplete) {
                        this.sendChat([
                            {
                                contents: team.name,
                                // TODO: Which color should this be?
                                color: 'white',
                            },
                            ' has completed a line!',
                        ]);
                    }
                    if (
                        linesComplete >= this.lineCount &&
                        !team.goalComplete
                    ) {
                        team.goalComplete = true;
                        team.players.values().forEach((player) => {
                            this.raceHandler?.playerFinished(player).then();
                        })
                        this.sendChat([
                            {
                                contents: team.name,
                                color: 'white',
                            },
                            ' has completed the goal!',
                        ]);
                    } else if (
                        linesComplete < this.lineCount &&
                        team.goalComplete
                    ) {
                        team.goalComplete = false;
                        team.players.values().forEach((player) => {
                            this.raceHandler?.playerUnfinshed(player).then();
                        })
                        this.sendChat([
                            {
                                contents: team.name,
                                color: 'white',
                            },
                            ' has no longer completed the goal.',
                        ]);
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
                        })
                        this.sendChat([
                            {
                                contents: team.name,
                                color: 'white',
                            },
                            ' has achieved blackout!',
                        ]);
                    } else if (!complete && team.goalComplete) {
                        team.goalComplete = false;
                        team.players.values().forEach((player) => {
                            this.raceHandler?.playerUnfinshed(player);
                        })
                        this.sendChat([
                            {
                                contents: team.name,
                                color: 'white',
                            },
                            ' no longer has blackout.',
                        ]);
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

        const player = this.getAllPlayers().find(p =>
            p.id === `${isSession ? 'session' : 'user'}:${user}`,
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
        const player = this.getAllPlayers().find(p => p.id === authToken.playerId);
        if (!player) {
            this.logWarn('Unable to find a player for a verified room token');
            return false;
        }
        this.logInfo(`Connecting ${player.nickname} to racetime`);
        return player.joinRace();
    }

    leaveRaceRoom(authToken: RoomTokenPayload) {
        const player = this.getAllPlayers().find(p => p.id === authToken.playerId);
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
        const player = this.getAllPlayers().find(p => p.id === roomAuth.playerId);
        if (!player) {
            this.logWarn('Unable to find a player for a verified room token');
            return false;
        }
        this.logInfo(`Readying ${player.nickname} to race`);
        return player.ready();
    }

    unreadyPlayer(roomAuth: RoomTokenPayload) {
        const player = this.getAllPlayers().find(p => p.id === roomAuth.playerId);
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
        this.sendChat([
            {
                contents: player.nickname,
                color: player.color,
            },
            ' has revealed the card.',
        ]);
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
