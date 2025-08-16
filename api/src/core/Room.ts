import {
    ChangeColorAction,
    ChatAction,
    ChatMessage,
    JoinAction,
    LeaveAction,
    MarkAction,
    NewCardAction,
    Player as PlayerData,
    RevealedBoard,
    ServerMessage,
    UnmarkAction,
} from '@playbingo/types';
import {
    BingoMode,
    GenerationBoardLayout,
    GenerationGlobalAdjustments,
    GenerationGoalRestriction,
    GenerationGoalSelection,
    GenerationListMode,
    GenerationListTransform,
} from '@prisma/client';
import { OPEN, WebSocket } from 'ws';
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
import { goalsForGame } from '../database/games/Goals';
import { shuffle } from '../util/Array';
import {
    checkCompletedLines,
    CompletedLines,
    computeLineMasks,
    listToBoard,
} from '../util/RoomUtils';
import { allRooms } from './RoomServer';
import BoardGenerator from './generation/BoardGenerator';
import {
    GeneratorGoal,
    GlobalGenerationState,
} from './generation/GeneratorCore';
import { generateFullRandom, generateRandomTyped } from './generation/Random';
import { generateSRLv5 } from './generation/SRLv5';
import RaceHandler, { RaceData } from './integration/races/RacetimeHandler';
import Player from './Player';

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

export interface GeneratorConfig {
    generationListMode: GenerationListMode[];
    generationListTransform: GenerationListTransform;
    generationBoardLayout: GenerationBoardLayout;
    generationGoalSelection: GenerationGoalSelection;
    generationGoalRestrictions: GenerationGoalRestriction[];
    generationGlobalAdjustments: GenerationGlobalAdjustments[];
}

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
    board: RevealedBoard;
    chatHistory: ChatMessage[];
    id: string;
    hideCard: boolean;
    bingoMode: BingoMode;
    lineCount: number;

    lastGenerationMode: BoardGenerationOptions;

    victoryMasks: bigint[];
    lastLineStatus: CompletedLines;
    completed: boolean;

    generatorConfig?: GeneratorConfig;
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
        racetimeUrl?: string,
        generatorConfig?: GeneratorConfig,
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

        this.lastGenerationMode = { mode: BoardGenerationMode.RANDOM };

        this.racetimeEligible = !!racetimeEligible;
        this.raceHandler = new RaceHandler(this);

        this.board = {
            board: [],
            hidden: false,
        };

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
        this.lastLineStatus = {};
        this.completed = false;

        this.generatorConfig = generatorConfig;
        this.newGenerator = !!generatorConfig;

        this.lastMessage = Date.now();
        this.inactivityWarningTimeout = setTimeout(
            () => this.warnClose(),
            roomCleanupInactive,
        );

        this.players = new Map<string, Player>();
    }

    async generateBoard(options: BoardGenerationOptions) {
        this.lastGenerationMode = options;
        const { mode, seed } = options;
        const goals = await goalsForGame(this.gameSlug);
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
        if (this.generatorConfig && mode !== BoardGenerationMode.DIFFICULTY) {
            const generator = new BoardGenerator(
                goals,
                categories,
                this.generatorConfig.generationListMode,
                this.generatorConfig.generationListTransform,
                this.generatorConfig.generationBoardLayout,
                this.generatorConfig.generationGoalSelection,
                this.generatorConfig.generationGoalRestrictions,
                this.generatorConfig.generationGlobalAdjustments,
            );
            generator.generateBoard();
            this.board = { board: listToBoard(generator.board) };
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
            this.board = { board: listToBoard(goalList) };
        }

        this.sendSyncBoard();
        setRoomBoard(
            this.id,
            this.board.board.flat().map((cell) => cell.goal.id),
        );
    }

    getPlayers(): PlayerData[] {
        const players: PlayerData[] = [];
        this.players.forEach((player) => {
            if (player.showInRoom()) {
                players.push(player.toClientData());
            }
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
                auth.user,
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
            board: this.hideCard ? { hidden: true } : this.board,
            chatHistory: this.chatHistory,
            identity: player.toClientData(),
            roomData: {
                game: this.game,
                slug: this.slug,
                name: this.name,
                gameSlug: this.gameSlug,
                newGenerator: this.newGenerator,
                racetimeConnection: {
                    gameActive: this.racetimeEligible,
                    url: this.raceHandler.url,
                    startDelay: this.raceHandler.data?.start_delay,
                    started: this.raceHandler.data?.started_at ?? undefined,
                    ended: this.raceHandler.data?.ended_at ?? undefined,
                    status: this.raceHandler.data?.status.verbose_value,
                },
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
        const index = row * 5 + col;
        if (player.hasMarked(index)) return;

        if (
            this.bingoMode === BingoMode.LOCKOUT &&
            this.board.board[row][col].completedPlayers.length > 0
        )
            return;
        this.board.board[row][col].completedPlayers.push(player.id);
        this.board.board[row][col].completedPlayers.sort((a, b) =>
            a.localeCompare(b),
        );
        player.mark(index);
        this.sendCellUpdate(row, col);
        this.sendChat([
            {
                contents: player.nickname,
                color: player.color,
            },
            ` marked ${this.board.board[row][col].goal.goal} (${row},${col})`,
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
        const index = unRow * 5 + unCol;
        if (!player.hasMarked(index)) return;
        this.board.board[unRow][unCol].completedPlayers = this.board.board[
            unRow
        ][unCol].completedPlayers.filter((playerId) => playerId !== player.id);
        player.unmark(index);
        this.sendCellUpdate(unRow, unCol);
        this.sendChat([
            { contents: player.nickname, color: player.color },
            ` unmarked ${this.board.board[unRow][unCol].goal.goal} (${unRow},${unCol})`,
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
                    'has left.',
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
            },
        });
        this.sendChat(`Racetime.gg room created ${url}`);
        this.raceHandler.connect(url);
        this.raceHandler.connectWebsocket();
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
        return this.board;
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
            cell: this.board.board[row][col],
        });
    }

    sendSyncBoard() {
        this.sendServerMessage({
            action: 'syncBoard',
            board: this.hideCard ? { hidden: true } : this.board,
        });
    }

    sendRaceData(data: RaceData) {
        this.logInfo('Dispatching race data update');
        this.sendServerMessage({
            action: 'syncRaceData',
            players: this.getPlayers(),
            racetimeConnection: {
                gameActive: this.racetimeEligible,
                url: this.raceHandler.url,
                startDelay: data.start_delay ?? undefined,
                started: data.started_at ?? undefined,
                ended: data.ended_at ?? undefined,
                status: data.status.verbose_value,
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
        switch (this.bingoMode) {
            case 'LINES':
                const lineCounts = checkCompletedLines(this.board.board);
                Object.keys(lineCounts).forEach((color) => {});
                this.players.forEach((player) => {
                    const { color, nickname, goalComplete } = player;
                    if (lineCounts[color] > this.lastLineStatus[color]) {
                        this.sendChat([
                            { contents: nickname, color },
                            ' has completed a line',
                        ]);
                    }
                    if (!goalComplete && lineCounts[color] >= this.lineCount) {
                        this.sendChat([
                            { contents: nickname, color },
                            ' has completed the goal!',
                        ]);
                        player.goalComplete = true;
                    }
                    if (goalComplete && lineCounts[color] < this.lineCount) {
                        player.goalComplete = false;
                        this.sendChat([
                            { contents: nickname, color },
                            ' has no longer completed the goal.',
                        ]);
                    }
                });
                this.lastLineStatus = lineCounts;
                break;
            case 'BLACKOUT':
                this.players.forEach((player) => {
                    const hasBlackout = this.board.board.every((row) =>
                        row.every((cell) =>
                            cell.completedPlayers.includes(player.id),
                        ),
                    );
                    if (hasBlackout && !player.goalComplete) {
                        player.goalComplete = true;
                        this.sendChat([
                            {
                                color: player.color,
                                contents: player.nickname,
                            },
                            ' has achieved blackout!',
                        ]);
                    }
                    if (!hasBlackout && player.goalComplete) {
                        player.goalComplete = false;
                        this.sendChat([
                            {
                                color: player.color,
                                contents: player.nickname,
                            },
                            ' no longer has blackout',
                        ]);
                    }
                });
                break;
            case 'LOCKOUT':
                this.players.forEach((player) => {
                    const goalCount = this.board.board.reduce((prev, row) => {
                        return (
                            prev +
                            row.reduce((p, cell) => {
                                if (
                                    cell.completedPlayers.includes(player.color)
                                ) {
                                    return p + 1;
                                }
                                return p;
                            }, 0)
                        );
                    }, 0);
                    if (!player.goalComplete && goalCount >= 13) {
                        this.sendChat([
                            {
                                contents: player.nickname,
                                color: player.color,
                            },
                            ' has achieved lockout!',
                        ]);
                        player.goalComplete = true;
                    }
                    if (player.goalComplete && goalCount < 13) {
                        this.sendChat([
                            {
                                contents: player.nickname,
                                color: player.color,
                            },
                            ' no longer has lockout.',
                        ]);
                        player.goalComplete = false;
                    }
                });
                break;
            default:
                break;
        }
        let allComplete = true;
        this.players.forEach((player) => {
            if (!player.spectator && !player.goalComplete) {
                allComplete = false;
            }
        });
        this.completed = allComplete;
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
    async canAutoAuthenticate(user?: string): Promise<false | Permissions> {
        console.log(user);
        if (!user) {
            return false;
        }

        const player = this.players.get(`user:${user}`);
        console.log(this.players);
        // console.log(player);
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
        this.raceHandler.connectWebsocket();
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
