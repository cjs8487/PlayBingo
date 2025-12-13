import { GeneratorSettings } from '@playbingo/shared';
import {
    ChangeColorAction,
    ChatAction,
    ChatMessage,
    JoinAction,
    LeaveAction,
    MarkAction,
    NewCardAction,
    Player as PlayerData,
    RevealedCell,
    ServerMessage,
    UnmarkAction,
} from '@playbingo/types';
import { BingoMode } from '@prisma/client';
import { WebSocket } from 'ws';
import { roomCleanupInactive } from '../Environment';
import { logError, logInfo, logWarn } from '../Logger';
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
import RacetimeHandler, { RaceData } from './integration/races/RacetimeHandler';
import LocalTimer from './integration/races/LocalTimer';
import RaceHandler from './integration/races/RaceHandler';

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

    players: Map<string, Player>;

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
            this.raceHandler = new LocalTimer();
        }

        this.board = [];

        if (racetimeUrl) {
            this.raceHandler.connect(racetimeUrl);
        }

        if (bingoMode === BingoMode.LINES) {
            this.victoryMasks = computeLineMasks(5, 5);
        } else if (bingoMode === BingoMode.BLACKOUT) {
            let mask = 0n;
            for (let i = 0; i < 25; i++) {
                mask |= 1n << BigInt(i);
            }
            this.victoryMasks = [mask];
        } else {
            this.victoryMasks = [];
        }

        this.hideCard = hideCard;
        this.completed = false;

        this.generatorSettings = generatorSettings;
        this.newGenerator = !!generatorSettings;

        this.lastMessage = Date.now();
        this.inactivityWarningTimeout = setTimeout(
            () => this.warnClose(),
            roomCleanupInactive,
        );

        this.players = new Map<string, Player>();

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
            generator.generateBoard();
            this.board = generator.board.map((row) =>
                row.map((goal) => ({
                    goal: goal,
                    completedPlayers: [],
                    revealed: true,
                })),
            );
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

    getPlayers(): PlayerData[] {
        const players: PlayerData[] = [];
        this.players.forEach((player) => {
            players.push(player.toClientData());
        });
        return players;
    }

    //#region Handlers
    handleJoin(
        action: JoinAction,
        auth: RoomTokenPayload,
        socket: WebSocket,
    ): ServerMessage {
        let player: Player | undefined;
        let newPlayer = false;
        if (this.players.has(auth.playerId)) {
            player = this.players.get(auth.playerId);
            if (!player) {
                return { action: 'unauthorized' };
            }
        } else if (action.payload) {
            player = new Player(
                this,
                auth.playerId,
                action.payload.nickname,
                undefined,
                auth.isSpectating,
                auth.isMonitor,
                auth.userId,
            );
            this.players.set(player.id, player);
            newPlayer = true;
        } else {
            player = this.players.get(auth.playerId);
            if (!player) {
                return { action: 'unauthorized' };
            }
        }

        if (newPlayer) {
            if (auth.isSpectating) {
                this.sendChat(`${player.nickname} is now spectating`);
            } else {
                this.sendChat([
                    { contents: player.nickname, color: player.color },
                    ' has joined.',
                ]);
            }
        }

        player.addConnection(auth.uuid, socket);
        addJoinAction(this.id, player.nickname, player.color).then();
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
                              ? player.obfuscateBoard()
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
                racetimeConnection: {
                    gameActive: this.racetimeEligible,
                    url: (this.raceHandler as RacetimeHandler).url,
                    startDelay: (this.raceHandler as RacetimeHandler).data
                        ?.start_delay,
                    status: (this.raceHandler as RacetimeHandler).data?.status
                        .verbose_value,
                },
                mode: getModeString(this.bingoMode, this.lineCount),
                variant: this.variantName,
                startedAt: this.raceHandler?.getStartTime(),
                finishedAt: this.raceHandler?.getEndTime(),
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
        for (const p of this.players.values()) {
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
            this.sendChat([
                { contents: player.nickname, color: player.color },
                ' has left.',
            ]);
            addLeaveAction(this.id, player.nickname, player.color).then();
            if (this.players.size === 0) {
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
        const player = this.players.get(auth.playerId);
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
        const player = this.players.get(auth.playerId);
        if (!player) {
            return { action: 'unauthorized' };
        }
        const { row, col } = action.payload;
        if (row === undefined || col === undefined) return;
        if (player.hasMarked(row, col)) return;

        if (
            this.bingoMode === BingoMode.LOCKOUT &&
            this.board[row][col].completedPlayers.length > 0
        )
            return;
        this.board[row][col].completedPlayers.push(player.id);
        this.board[row][col].completedPlayers.sort((a, b) =>
            a.localeCompare(b),
        );
        player.mark(row, col);
        this.sendCellUpdate(row, col);
        this.sendChat([
            {
                contents: player.nickname,
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
        const player = this.players.get(auth.playerId);
        if (!player) {
            return { action: 'unauthorized' };
        }
        const { row: unRow, col: unCol } = action.payload;
        if (unRow === undefined || unCol === undefined) return;
        if (!player.hasMarked(unRow, unCol)) return;
        this.board[unRow][unCol].completedPlayers = this.board[unRow][
            unCol
        ].completedPlayers.filter((playerId) => playerId !== player.id);
        player.unmark(unRow, unCol);
        this.sendCellUpdate(unRow, unCol);
        this.sendChat([
            { contents: player.nickname, color: player.color },
            ` unmarked ${this.board[unRow][unCol].goal.goal} (${unRow},${unCol})`,
        ]);
        addUnmarkAction(this.id, player.id, unRow, unCol).then();
        this.checkWinConditions();
    }

    handleChangeColor(
        action: ChangeColorAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const player = this.players.get(auth.playerId);
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
        createUpdatePlayer(this.id, player).then();
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

    handleSocketClose(ws: WebSocket) {
        let player: Player | undefined;
        for (const p of this.players.values()) {
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
                if (this.players.size === 0) {
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
                racetimeConnection: {
                    url,
                },
                newGenerator: this.newGenerator,
                mode: getModeString(this.bingoMode, this.lineCount),
                variant: this.variantName,
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
                racetimeConnection: {
                    url: undefined,
                },
                newGenerator: this.newGenerator,
                mode: getModeString(this.bingoMode, this.lineCount),
                variant: this.variantName,
            },
        });
    }

    handleRevealCard(payload: RoomTokenPayload) {
        const player = this.players.get(payload.playerId);
        if (!player) {
            return null;
        }
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
    //#endregion

    //#region Send Messages
    sendChat(message: string): void;
    sendChat(message: ChatMessage): void;

    sendChat(message: string | ChatMessage) {
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
                started: data.started_at ?? undefined,
                ended: data.ended_at ?? undefined,
                status: data.status.verbose_value,
            },
        });
    }

    sendRoomData() {
        this.sendServerMessage({
            action: 'updateRoomData',
            roomData: {
                game: this.game,
                slug: this.slug,
                name: this.name,
                gameSlug: this.gameSlug,
                racetimeConnection: {
                    url: undefined,
                },
                newGenerator: this.newGenerator,
                mode: getModeString(this.bingoMode, this.lineCount),
                variant: this.variantName,
                startedAt: this.raceHandler?.getStartTime(),
                finishedAt: this.raceHandler?.getEndTime(),
            },
        });
    }

    private sendServerMessage(
        message: ServerMessage,
        updateInactivity: boolean = true,
    ) {
        this.players.forEach((player) => {
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
        this.players.forEach((player) => {
            if (this.bingoMode === BingoMode.LOCKOUT) {
                if (!player.goalComplete && player.goalCount >= 13) {
                    this.sendChat([
                        {
                            contents: player.nickname,
                            color: player.color,
                        },
                        ' has achieved lockout!',
                    ]);
                    player.goalComplete = true;
                    this.raceHandler?.playerFinished(player);
                }
                if (player.goalComplete && player.goalCount < 13) {
                    this.sendChat([
                        {
                            contents: player.nickname,
                            color: player.color,
                        },
                        ' no longer has lockout.',
                    ]);
                    player.goalComplete = false;
                    this.raceHandler?.playerUnfinshed(player);
                }
            } else {
                if (this.bingoMode === BingoMode.LINES) {
                    const linesComplete = this.victoryMasks.reduce(
                        (count, mask) =>
                            count + (player.hasCompletedGoals(mask) ? 1 : 0),
                        0,
                    );
                    if (linesComplete > player.linesComplete) {
                        this.sendChat([
                            {
                                contents: player.nickname,
                                color: player.color,
                            },
                            ' has completed a line!',
                        ]);
                    }
                    if (
                        linesComplete >= this.lineCount &&
                        !player.goalComplete
                    ) {
                        player.goalComplete = true;
                        this.raceHandler?.playerFinished(player);
                        this.sendChat([
                            {
                                contents: player.nickname,
                                color: player.color,
                            },
                            ' has completed the goal!',
                        ]);
                    } else if (
                        linesComplete < this.lineCount &&
                        player.goalComplete
                    ) {
                        player.goalComplete = false;
                        this.raceHandler?.playerUnfinshed(player);
                        this.sendChat([
                            {
                                contents: player.nickname,
                                color: player.color,
                            },
                            ' has no longer completed the goal.',
                        ]);
                    }
                    player.linesComplete = linesComplete;
                } else {
                    const complete = this.victoryMasks.every((mask) =>
                        player.hasCompletedGoals(mask),
                    );
                    if (complete && !player.goalComplete) {
                        player.goalComplete = true;
                        this.raceHandler?.playerFinished(player);
                        this.sendChat([
                            {
                                contents: player.nickname,
                                color: player.color,
                            },
                            ' has achieved blackout!',
                        ]);
                    } else if (!complete && player.goalComplete) {
                        player.goalComplete = false;
                        this.raceHandler?.playerUnfinshed(player);
                        this.sendChat([
                            {
                                contents: player.nickname,
                                color: player.color,
                            },
                            ' no longer has blackout.',
                        ]);
                    }
                }
            }
        });
        let allComplete = true;
        this.players.forEach((player) => {
            if (!player.spectator && !player.goalComplete) {
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

        const player = this.players.get(
            `${isSession ? 'session' : 'user'}:${user}`,
        );
        if (player) {
            return {
                isMonitor: player.monitor,
                isSpectating: player.spectator,
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
        const player = this.players.get(authToken.playerId);
        if (!player) {
            this.logWarn('Unable to find a player for a verified room token');
            return false;
        }
        this.logInfo(`Connecting ${player.nickname} to racetime`);
        player.raceId = racetimeId;
        return player.joinRace();
    }

    async refreshRacetimeHandler() {
        this.raceHandler.refresh();
    }

    readyPlayer(roomAuth: RoomTokenPayload) {
        const player = this.players.get(roomAuth.playerId);
        if (!player) {
            this.logWarn('Unable to find a player for a verified room token');
            return false;
        }
        this.logInfo(`Readying ${player.nickname} to race`);
        return player.ready();
    }

    unreadyPlayer(roomAuth: RoomTokenPayload) {
        const player = this.players.get(roomAuth.playerId);
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
            return this.players.size <= 0;
        }
        return false;
    }

    /**
     * Runs room level cleanup tasks and closes all open connections to the room
     */
    close() {
        this.logInfo('Closing room.');
        this.sendSystemMessage('This room has been closed due to inactivity.');
        this.players.forEach((player) => {
            player.connections.forEach((connection) => {
                this.handleSocketClose(connection);
                connection.close(1001, 'Room is closing.');
            });
        });
        allRooms.delete(this.slug);
    }
    //#endregion
}
