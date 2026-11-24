import { GeneratorSettings } from '@playbingo/shared';
import {
    AnnouncementPlayer,
    Cell,
    ChangeColorAction,
    ChangeRaceHandlerAction,
    ChatAction,
    ChatMessage,
    JoinAction,
    JoinTeamAction,
    LeaveAction,
    MarkAction,
    NewCardAction,
    Player as PlayerData,
    RevealedCell,
    RoomAnnouncement,
    RoomData,
    ServerMessage,
    SetChatEnabledAction,
    SetTeamsEnabledAction,
    Team as TeamData,
    UnmarkAction,
} from '@playbingo/types';
import { BingoMode, Category } from '@prisma/client';
import EventEmitter from 'events';
import { randomUUID } from 'node:crypto';
import { roomCleanupInactive } from '../Environment';
import { logDebug, logError, logInfo, logWarn } from '../Logger';
import {
    invalidateToken,
    Permissions,
    RoomTokenPayload,
} from '../auth/RoomAuth';
import { isStaff } from '../database/Users';
import { isModerator } from '../database/games/Games';
import { shuffle } from '../util/Array';
import {
    computeLineMasks,
    getModeString,
    listToBoard,
    rowColToMask,
} from '../util/RoomUtils';
import Player from './Player';
import { allRooms } from './RoomServer';
import Team from './Team';
import Connection from './connection/Connection';
import { BoardGenerator } from './generation/BoardGenerator';
import { GenerationFailedError } from './generation/GenerationFailedError';
import {
    GeneratorGoal,
    GlobalGenerationState,
} from './generation/GeneratorCore';
import { generateFullRandom, generateRandomTyped } from './generation/Random';
import { generateSRLv5 } from './generation/SRLv5';
import LocalTimer from './integration/races/LocalTimer';
import RaceHandler from './integration/races/RaceHandler';
import RacetimeHandler, { RaceData } from './integration/races/RacetimeHandler';

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

export interface BoardGenerationInputs {
    goals: GeneratorGoal[];
    categories: Category[];
    typedRandom?: boolean;
    difficulty?: {
        groups: number | null | undefined;
        goalAmounts: number[] | undefined;
    };
}

export type PlayerAnnouncement = Extract<
    RoomAnnouncement,
    { player: AnnouncementPlayer }
>;
type PlayerAnnouncementAction =
    | {
          action:
              | 'players:join'
              | 'players:leave'
              | 'board:revealed'
              | 'players:startedSpectating'
              | 'players:startedPlaying'
              | 'team:joined'
              | 'team:renamed';
      }
    | { action: 'player:chat'; message: string }
    | { action: 'player:colorChanged'; newColor: string }
    | {
          action: 'board:goalMarked' | 'board:goalUnmarked';
          row: number;
          col: number;
          goal?: string;
      };

export interface RacetimeCreationInputs {
    category: string | null;
    goal: string | null;
    token?: string;
}

interface RoomEventArguments {
    'board:generationRequested': [
        options: BoardGenerationOptions,
        supply: (inputs: Promise<BoardGenerationInputs>) => void,
    ];
    'player:membershipChanged': [
        player: Player,
        kind: 'participation' | 'team',
    ];
    'team:disbanded': [team: Team];
    'team:renamed': [player: Player, team: Team];
    'race:playerChanged': [player: Player];
    'race:startChanged': [startedAt: string | null];
    'race:finishChanged': [finishedAt: string | null];
    'race:handlerChanged': [handler: ReturnType<RaceHandler['key']>];
    'room:teamsEnabledChanged': [enabled: boolean];
    'racetime:identityRequested': [
        userId: string,
        supply: (result: Promise<string | undefined>) => void,
    ];
    'racetime:creationInputsRequested': [
        userId: string,
        supply: (result: Promise<RacetimeCreationInputs | undefined>) => void,
    ];
    'racetime:connectionRequested': [url: string];
    'racetime:disconnected': [];
    'racetime:created': [url: string];
    'room:inactivityWarning': [];
    'room:closing': [];
    'room:closed': [];
    'chat:announcement': [
        announcement: RoomAnnouncement,
        exclude: Player | undefined,
    ];
    'player:connected': [player: Player, newPlayer: boolean];
    'player:chat': [player: Player, message: string];
    'players:join': [player: Player];
    'players:leave': [player: Player];
    'player:colorChanged': [player: Player, newColor: string, oldColor: string];
    'team:lineCompleted': [team: Team];
    'team:finished': [team: Team];
    'team:unfinished': [team: Team];
    'board:cellUpdate': [cell: Cell, row: number, col: number];
    'board:goalMarked': [cell: Cell, row: number, col: number, player: Player];
    'board:goalUnmarked': [
        cell: Cell,
        row: number,
        col: number,
        player: Player,
    ];
    'board:regenerated': [
        board: RevealedCell[][],
        options: BoardGenerationOptions,
    ];
    'board:revealed': [player: Player];
    'timer:started': [];
    'timer:reset': [];
    'timer:stopped': [];
}

export type RoomEvents = {
    [Event in keyof RoomEventArguments]: (
        ...args: [...RoomEventArguments[Event], timestamp: Date]
    ) => void;
};

/**
 * Represents a room in the PlayBingo service. A room is container for a single
 * "game" of bingo, containing the board, game state, history, and all other
 * game level data.
 */
export default class Room extends EventEmitter {
    name: string;
    game: string;
    gameSlug: string;
    password: string;
    slug: string;
    board: RevealedCell[][];
    chatHistory: (ChatMessage | RoomAnnouncement)[];
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
        public boardWidth: number = 5,
        public boardHeight: number = 5,
        teamsEnabled: boolean = false,
    ) {
        super();

        this.name = name;
        this.game = game;
        this.gameSlug = gameSlug;
        this.password = password;
        this.slug = slug;
        this.chatHistory = [];
        this.subscribeToAnnouncements();
        this.on('board:cellUpdate', (_cell, _row, _col, timestamp) => {
            this.checkWinConditions(timestamp);
        });
        const onGoalChanged: RoomEvents['board:goalMarked'] = (
            _cell,
            _row,
            _col,
            _player,
            timestamp,
        ) => {
            this.checkWinConditions(timestamp);
        };
        this.on('board:goalMarked', onGoalChanged);
        this.on('board:goalUnmarked', onGoalChanged);
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
                    this.alwaysRevealedMask |= rowColToMask(0, 0, boardWidth);
                    break;
                case 'TR':
                    this.alwaysRevealedMask |= rowColToMask(
                        0,
                        boardWidth - 1,
                        boardWidth,
                    );
                    break;
                case 'BL':
                    this.alwaysRevealedMask |= rowColToMask(
                        boardHeight - 1,
                        0,
                        boardWidth,
                    );
                    break;
                case 'BR':
                    this.alwaysRevealedMask |= rowColToMask(
                        boardHeight - 1,
                        boardWidth - 1,
                        boardWidth,
                    );
                    break;
                case 'CENTER':
                    for (const row of new Set([
                        Math.floor((boardHeight - 1) / 2),
                        Math.floor(boardHeight / 2),
                    ])) {
                        for (const col of new Set([
                            Math.floor((boardWidth - 1) / 2),
                            Math.floor(boardWidth / 2),
                        ])) {
                            this.alwaysRevealedMask |= rowColToMask(
                                row,
                                col,
                                boardWidth,
                            );
                        }
                    }
                    break;
                default:
                    const startCount = Number(explorationStart);
                    if (isNaN(startCount)) {
                        this.logWarn(
                            'Unknown starting square for exploration. Exploration was not enabled for this room.',
                        );
                        this.exploration = false;
                    }
                    const cells = [...Array(boardWidth * boardHeight).keys()];
                    shuffle(cells);
                    for (let i = 0; i < startCount; i++) {
                        const cell = cells.pop();
                        if (cell === undefined) {
                            return;
                        }
                        this.alwaysRevealedMask |= rowColToMask(
                            Math.floor(cell / boardWidth),
                            cell % boardWidth,
                            boardWidth,
                        );
                    }
            }
        }
    }

    //#region EventEmitter
    on<Event extends keyof RoomEvents>(
        event: Event,
        listener: RoomEvents[Event],
    ): this {
        return super.on(event, listener);
    }

    once<Event extends keyof RoomEvents>(
        event: Event,
        listener: RoomEvents[Event],
    ): this {
        return super.once(event, listener);
    }

    off<Event extends keyof RoomEvents>(
        event: Event,
        listener: RoomEvents[Event],
    ): this {
        return super.off(event, listener);
    }

    addListener<Event extends keyof RoomEvents>(
        event: Event,
        listener: RoomEvents[Event],
    ): this {
        return super.addListener(event, listener);
    }

    removeListener<Event extends keyof RoomEvents>(
        event: Event,
        listener: RoomEvents[Event],
    ): this {
        return super.removeListener(event, listener);
    }

    emit<Event extends keyof RoomEvents>(
        event: Event,
        ...args: [...RoomEventArguments[Event], timestamp?: Date]
    ): boolean {
        // Event arguments carry their own data. A trailing Date overrides the emission time.
        return args.at(-1) instanceof Date
            ? super.emit(event, ...args)
            : super.emit(event, ...args, new Date());
    }
    //#endregion

    getAllPlayers(): Player[] {
        const players: Player[] = [...this.spectators.values()];
        this.teams.forEach((team) => {
            team.players.forEach((player) => players.push(player));
        });
        return players;
    }

    getPlayerById(playerId: string): Player | undefined {
        return this.getAllPlayers().find((player) => player.id === playerId);
    }

    getTeamForPlayer(playerId: string): Team | undefined {
        return Array.from(this.teams.values()).find((team) =>
            team.players.has(playerId),
        );
    }

    /** Creates a new single player team owned by the given player */
    createTeamForPlayer(player: Player): Team {
        const team = new Team(
            this,
            randomUUID(),
            this.teamsEnabled ? `${player.nickname}'s Team` : player.nickname,
            'blue',
        );
        team.addPlayer(player);
        player.teamId = team.id;
        this.teams.set(team.id, team);
        return team;
    }

    /**
     * Removes a player from their current team, deleting the team if they were
     * its last member.
     *
     * @param player The player to remove from a team
     * @param team The team to remove the player from
     *
     * @returns The team the player was removed from, if it still exists
     */
    removePlayerFromTeam(
        player: Player,
        team: Team | undefined,
    ): Team | undefined {
        if (!team) {
            return undefined;
        }
        if (player.teamId === team.id) {
            // Only set teamId to undefined if player didn't join a new team yet
            player.teamId = undefined;
        }
        team.removePlayer(player.id);
        if (team.players.size === 0) {
            this.deleteTeam(team.id);
            return undefined;
        }
        return team;
    }

    /**
     * Moves a player between playing and spectating, creating or tearing down
     * their team as needed.
     *
     * @returns true if the player's participation actually changed
     */
    setPlayerSpectating(player: Player, spectating: boolean) {
        const isSpectating = this.spectators.has(player.id);
        if (isSpectating === spectating) {
            return false;
        }
        const timestamp = new Date();
        if (spectating) {
            this.removePlayerFromTeam(player, this.getTeamForPlayer(player.id));
            this.spectators.set(player.id, player);
        } else {
            this.spectators.delete(player.id);
            this.createTeamForPlayer(player);
        }
        this.markActive();
        this.emit(
            'player:membershipChanged',
            player,
            'participation',
            timestamp,
        );
        player.syncBoard();
        return true;
    }

    deleteTeam(teamId: string) {
        const team = this.teams.get(teamId);
        if (!team) {
            return;
        }
        team.destroy();
        this.teams.delete(teamId);
        this.emit('team:disbanded', team);
        // the team no longer exists, so clients can't resolve it from the cell
        let boardChanged = false;
        this.board.forEach((row) => {
            row.forEach((cell) => {
                const index = cell.completedTeams.indexOf(teamId);
                if (index >= 0) {
                    cell.completedTeams.splice(index, 1);
                    boardChanged = true;
                }
            });
        });
        if (boardChanged) {
            this.getAllPlayers().forEach((player) => player.syncBoard());
        }
    }

    spectatorObfuscateBoard(): Cell[][] {
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
                    ? cell
                    : {
                          revealed: false,
                          completedTeams: cell.completedTeams,
                      };
            }),
        );
    }

    async generateBoard(options: BoardGenerationOptions) {
        this.lastGenerationMode = options;
        const { mode, seed } = options;
        const inputs: Promise<BoardGenerationInputs>[] = [];
        this.emit(
            'board:generationRequested',
            options,
            (data: Promise<BoardGenerationInputs>) => inputs.push(data),
        );
        const [data] = await Promise.all(inputs);
        if (!data)
            throw new Error('No board generation input source is subscribed');
        const { goals, categories } = data;
        let goalList: GeneratorGoal[];
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
                this.boardWidth,
                options.seed,
            );
            if (
                this.generatorSettings.boardLayout.mode === 'custom' &&
                (this.generatorSettings.boardLayout.layout.length !==
                    this.boardHeight ||
                    this.generatorSettings.boardLayout.layout.some(
                        (row) => row.length !== this.boardWidth,
                    ))
            ) {
                throw new GenerationFailedError(
                    'Custom layout dimensions no longer match this room',
                    generator,
                );
            }
            generator.reset(options.seed);
            generator.generateBoard();
            if (
                generator.board.length !== this.boardHeight ||
                generator.board.some((row) => row.length !== this.boardWidth)
            ) {
                throw new GenerationFailedError(
                    'Generated board dimensions do not match this room',
                    generator,
                );
            }
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
                        const numGroups = data.difficulty?.groups;
                        const goalAmounts = data.difficulty?.goalAmounts;
                        if (!numGroups || !goalAmounts) {
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
                            const toAdd = group.splice(0, goalAmounts[index]);
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
                        if (data.typedRandom) {
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
        this.teams.forEach((team) => team.reset());
        this.completed = false;
        this.raceHandler.resetTimer();

        this.getAllPlayers().forEach((player) => {
            player.boardHidden = this.hideCard;
        });
        this.markActive();
        this.emit('board:regenerated', this.board, options, new Date());
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

    get roomData(): RoomData {
        return {
            game: this.game,
            slug: this.slug,
            name: this.name,
            gameSlug: this.gameSlug,
            newGenerator: this.newGenerator,
            seed: this.seed,
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
            mode: getModeString(this.bingoMode, this.lineCount),
            variant: this.variantName,
            teamsEnabled: this.teamsEnabled,
            chatEnabled: this.chatEnabled,
            startedAt: this.raceHandler?.getStartTime(),
            finishedAt: this.raceHandler?.getEndTime(),
            raceHandler: this.raceHandler?.key(),
        };
    }

    //#region Handlers
    handleJoin(action: JoinAction, auth: RoomTokenPayload) {
        let player = this.getPlayerById(auth.playerId);
        let newPlayer = false;
        if (!player && action.payload) {
            player = new Player(
                this,
                auth.playerId,
                action.payload.nickname,
                auth.isMonitor,
                undefined,
                auth.userId,
            );
            if (auth.isSpectating) {
                this.spectators.set(player.id, player);
            } else {
                this.createTeamForPlayer(player);
            }
            newPlayer = true;
        }

        return player ? { player, newPlayer } : undefined;
    }

    playerConnected(player: Player, newPlayer: boolean) {
        const timestamp = new Date();
        if (newPlayer) {
            this.emit('players:join', player, timestamp);
            this.markActive();
        }

        this.emit('player:connected', player, newPlayer, timestamp);
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
        const oldTeam = player.teamId
            ? this.teams.get(player.teamId)
            : undefined;
        let team: Team | undefined;
        if (action.payload.teamId) {
            team = this.teams.get(action.payload.teamId);
        } else if (action.payload.teamId === null) {
            // only create a new team if teamId was set specifically to null
            team = this.createTeamForPlayer(player);
        }
        if (!team) {
            return { action: 'unauthorized' };
        }
        if (action.payload.teamName) {
            team.name = action.payload.teamName;
        }
        // Check if there was an old team
        if (oldTeam) {
            if (oldTeam.id !== team.id) {
                this.removePlayerFromTeam(player, oldTeam);
            } else if (action.payload.teamName) {
                this.markActive();
                this.emit('team:renamed', player, team);
                return {
                    action: 'updatedTeam',
                    team: team.toClientData(),
                };
            }
        }
        this.spectators.delete(player.id);
        player.teamId = team.id;
        team.addPlayer(player);
        this.markActive();
        this.emit('player:membershipChanged', player, 'team');
        player.syncBoard();
        return {
            action: 'joinedTeam',
            team: team.toClientData(),
        };
    }

    /**
     * Handles a leave action
     * @param action The action object from the protocol
     * @param auth The room token payload representing the requestors
     * authorization to perform this action
     * @param token The token from the request
     * @returns Whether a connection was removed
     */
    handleLeave(
        action: LeaveAction,
        auth: RoomTokenPayload,
        token: string,
    ): boolean {
        // removeConnection reports whether it owned the connection, so find
        // stops as soon as the owning player has cleaned it up
        const player = this.getAllPlayers().find((p) =>
            p.removeConnection(auth.uuid),
        );
        if (!player) {
            return false;
        }
        const hasLeft = !player.hasConnections();
        const timestamp = new Date();
        if (hasLeft) {
            this.handleDisconnectedPlayer(player, timestamp);
        }
        invalidateToken(token);
        return true;
    }

    private handleDisconnectedPlayer(player: Player, timestamp: Date) {
        this.markActive();
        this.emit('players:leave', player, timestamp);
        const anyoneConnected =
            this.teams.values().some((team) => team.showInRoom()) ||
            this.spectators
                .values()
                .some((spectator) => spectator.showInRoom());
        if (!anyoneConnected) {
            this.close();
        }
    }

    handleChat(
        action: ChatAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const player = this.getPlayerById(auth.playerId);
        if (!player) {
            return { action: 'unauthorized' };
        }
        const { message: chatMessage } = action.payload;
        if (!chatMessage) return;
        const timestamp = new Date();
        if (this.chatEnabled) this.markActive();
        this.emit('player:chat', player, chatMessage, timestamp);
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
        const timestamp = new Date();
        this.emit(
            'board:goalMarked',
            this.board[row][col],
            row,
            col,
            player,
            timestamp,
        );
        this.markActive();
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
        const timestamp = new Date();
        this.emit(
            'board:goalUnmarked',
            this.board[unRow][unCol],
            unRow,
            unCol,
            player,
            timestamp,
        );
        this.markActive();
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
        const team = player.teamId ? this.teams.get(player.teamId) : undefined;
        if (!team) {
            return { action: 'unauthorized' };
        }
        const timestamp = new Date();
        const oldColor = team.color;
        team.color = color;
        this.emit('player:colorChanged', player, color, oldColor, timestamp);
        this.markActive();
    }

    handleNewCard(action: NewCardAction) {
        if (action.options) {
            const options = action.options;
            if (!options.mode) {
                options.mode = this.lastGenerationMode.mode;
            }
            return this.generateBoard(options as BoardGenerationOptions);
        } else {
            // TODO: we should probably generate a new seed before generating
            // the board from the previous settings
            return this.generateBoard(this.lastGenerationMode);
        }
    }

    handleStartTimer() {
        const previous = this.raceHandler.getStartTime();
        this.raceHandler.startTimer();
        const startedAt = this.raceHandler.getStartTime();
        if (startedAt && startedAt !== previous) {
            this.emit('timer:started', new Date(startedAt));
        }
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
        this.emit('race:handlerChanged', this.raceHandler.key());
    }

    handleResetTimer() {
        this.raceHandler?.resetTimer();
        this.emit('timer:reset');
    }

    handleSocketClose(ws: Connection) {
        // handleSocketClose reports whether it owned the socket, so find stops
        // as soon as the owning player has cleaned it up
        const player = this.getAllPlayers().find((p) =>
            p.handleSocketClose(ws),
        );
        if (!player) {
            return false;
        }
        if (!player.hasConnections()) {
            this.handleDisconnectedPlayer(player, new Date());
        }
        return true;
    }

    handleRacetimeRoomCreated(url: string) {
        this.emit('racetime:connectionRequested', url);
        this.sendServerMessage({
            action: 'updateRoomData',
            roomData: {
                ...this.roomData,
                racetimeConnection: { url },
            },
        });
        this.raceHandler.connect(url);
        (this.raceHandler as RacetimeHandler).connectWebsocket();
        this.emit('racetime:created', url);
    }

    handleRacetimeRoomDisconnected() {
        this.raceHandler.disconnect();
        this.sendServerMessage({
            action: 'updateRoomData',
            roomData: {
                ...this.roomData,
                racetimeConnection: { url: undefined },
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
        this.emit('room:teamsEnabledChanged', this.teamsEnabled);
        this.sendRoomData();
    }
    //#endregion

    getChatHistory(player: Player) {
        const board =
            !player.boardHidden && this.exploration
                ? player.getBoardView()
                : undefined;
        return this.chatHistory.map((entry) =>
            Array.isArray(entry)
                ? entry
                : player.visibleAnnouncement(entry, board),
        );
    }

    private subscribeToAnnouncements() {
        for (const action of [
            'players:join',
            'players:leave',
            'board:revealed',
        ] as const) {
            this.on(action, (player, timestamp) => {
                this.recordAnnouncement(
                    this.createPlayerAnnouncement(
                        player,
                        { action },
                        timestamp,
                    ),
                    action === 'players:join' ? player : undefined,
                );
            });
        }
        this.on('player:membershipChanged', (player, kind, timestamp) => {
            const action =
                kind === 'team'
                    ? 'team:joined'
                    : player.teamId
                      ? 'players:startedPlaying'
                      : 'players:startedSpectating';
            this.recordAnnouncement(
                this.createPlayerAnnouncement(player, { action }, timestamp),
            );
        });
        this.on('team:renamed', (player, _team, timestamp) => {
            this.recordAnnouncement(
                this.createPlayerAnnouncement(
                    player,
                    { action: 'team:renamed' },
                    timestamp,
                ),
            );
        });
        this.on('team:disbanded', (team, timestamp) => {
            this.recordAnnouncement({
                action: 'team:disbanded',
                team: { name: team.name, color: team.color },
                teamDisplayName: team.getDisplayName(),
                ...this.announcementTime(timestamp),
            });
        });
        this.on('player:chat', (player, message, timestamp) => {
            this.recordAnnouncement(
                this.createPlayerAnnouncement(
                    player,
                    { action: 'player:chat', message },
                    timestamp,
                ),
            );
        });
        this.on('racetime:created', (url, timestamp) => {
            this.recordAnnouncement({
                action: 'racetime:created',
                url,
                ...this.announcementTime(timestamp),
            });
        });
        for (const action of [
            'room:inactivityWarning',
            'room:closing',
        ] as const) {
            this.on(action, (timestamp) => {
                this.recordAnnouncement({
                    action,
                    ...this.announcementTime(timestamp),
                });
            });
        }
        this.on(
            'player:colorChanged',
            (player, newColor, _oldColor, timestamp) => {
                this.recordAnnouncement(
                    this.createPlayerAnnouncement(
                        player,
                        { action: 'player:colorChanged', newColor },
                        timestamp,
                    ),
                );
            },
        );
        for (const action of [
            'board:goalMarked',
            'board:goalUnmarked',
        ] as const) {
            this.on(action, (cell, row, col, player, timestamp) => {
                this.recordAnnouncement(
                    this.createPlayerAnnouncement(
                        player,
                        {
                            action,
                            row,
                            col,
                            goal: cell.revealed ? cell.goal.goal : undefined,
                        },
                        timestamp,
                    ),
                );
            });
        }
        for (const action of [
            'team:lineCompleted',
            'team:finished',
            'team:unfinished',
        ] as const) {
            this.on(action, (team, timestamp) => {
                this.recordAnnouncement({
                    action,
                    team: { name: team.name, color: team.color },
                    teamDisplayName: team.getDisplayName(),
                    mode: this.bingoMode,
                    ...this.announcementTime(timestamp),
                });
            });
        }
        this.on('board:regenerated', (_board, _options, timestamp) => {
            this.recordAnnouncement({
                action: 'board:regenerated',
                ...this.announcementTime(timestamp),
            });
        });
        for (const action of [
            'timer:started',
            'timer:stopped',
            'timer:reset',
        ] as const) {
            this.on(action, (timestamp) => {
                this.recordAnnouncement({
                    action,
                    ...this.announcementTime(timestamp),
                });
            });
        }
    }

    createPlayerAnnouncement(
        player: Player,
        action: PlayerAnnouncementAction,
        timestamp: Date,
    ): PlayerAnnouncement {
        const team = this.getTeamForPlayer(player.id);
        return {
            ...action,
            player: {
                nickname: player.nickname,
                teamsEnabled: this.teamsEnabled,
                team: team ? { name: team.name, color: team.color } : undefined,
            },
            ...this.announcementTime(timestamp),
        };
    }

    private announcementTime(timestamp: Date) {
        return {
            timestamp: timestamp.toISOString(),
            startedAt: this.raceHandler.getStartTime(),
        };
    }

    private recordAnnouncement(
        announcement: RoomAnnouncement,
        exclude?: Player,
    ) {
        if (
            this.chatEnabled ||
            announcement.action === 'room:inactivityWarning' ||
            announcement.action === 'room:closing'
        ) {
            this.chatHistory.push(announcement);
            this.emit('chat:announcement', announcement, exclude);
        } else if (
            [
                'players:join',
                'players:leave',
                'player:colorChanged',
                'players:startedPlaying',
                'players:startedSpectating',
                'team:joined',
                'team:renamed',
                'team:disbanded',
            ].includes(announcement.action)
        ) {
            this.sendRoomData();
        }
    }

    //#region Send Messages
    sendCellUpdate(row: number, col: number) {
        this.markActive();
        this.emit('board:cellUpdate', this.board[row][col], row, col);
    }

    sendSyncBoard() {
        this.sendServerMessage({
            action: 'syncBoard',
            board: {
                width: this.boardWidth,
                height: this.boardHeight,
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
            roomData: this.roomData,
        });
    }

    private sendServerMessage(message: ServerMessage) {
        this.getAllPlayers().forEach((player) => {
            player.sendMessage({ ...message, players: this.getPlayerData() });
        });
        this.markActive();
    }

    private markActive() {
        this.lastMessage = Date.now();
        this.inactivityWarningTimeout?.refresh();
        clearTimeout(this.closeTimeout);
        this.closeTimeout = undefined;
    }

    /** Marks a team, and every player on it, as finished or unfinished */
    private setTeamComplete(team: Team, complete: boolean) {
        team.goalComplete = complete;
        team.players.forEach((player) => {
            if (complete) {
                this.raceHandler?.playerFinished(player);
            } else {
                this.raceHandler?.playerUnfinshed(player);
            }
        });
    }

    private checkWinConditions(timestamp: Date) {
        this.teams.forEach((team) => {
            if (this.bingoMode === BingoMode.LOCKOUT) {
                const goalsNeeded = Math.ceil(
                    (this.boardHeight * this.boardWidth) / 2,
                );
                if (!team.goalComplete && team.goalCount >= goalsNeeded) {
                    this.setTeamComplete(team, true);
                    this.emit('team:finished', team, timestamp);
                }
                if (team.goalComplete && team.goalCount < goalsNeeded) {
                    this.setTeamComplete(team, false);
                    this.emit('team:unfinished', team, timestamp);
                }
            } else {
                if (this.bingoMode === BingoMode.LINES) {
                    const linesComplete = this.victoryMasks.reduce(
                        (count, mask) =>
                            count + (team.hasCompletedGoals(mask) ? 1 : 0),
                        0,
                    );
                    if (linesComplete > team.linesComplete) {
                        this.emit('team:lineCompleted', team, timestamp);
                    }
                    if (linesComplete >= this.lineCount && !team.goalComplete) {
                        this.setTeamComplete(team, true);
                        this.emit('team:finished', team, timestamp);
                    } else if (
                        linesComplete < this.lineCount &&
                        team.goalComplete
                    ) {
                        this.setTeamComplete(team, false);
                        this.emit('team:unfinished', team, timestamp);
                    }
                    team.linesComplete = linesComplete;
                } else {
                    const complete = this.victoryMasks.every((mask) =>
                        team.hasCompletedGoals(mask),
                    );
                    if (complete && !team.goalComplete) {
                        this.setTeamComplete(team, true);
                        this.emit('team:finished', team, timestamp);
                    } else if (!complete && team.goalComplete) {
                        this.setTeamComplete(team, false);
                        this.emit('team:unfinished', team, timestamp);
                    }
                }
            }
        });
        this.completed =
            this.teams.size > 0 &&
            this.teams.values().every((team) => team.goalComplete);
        const previousEnd = this.raceHandler.getEndTime();
        if (this.completed && !previousEnd) {
            this.raceHandler.allPlayersFinished();
            const finishedAt = this.raceHandler.getEndTime();
            if (finishedAt) this.emit('timer:stopped', new Date(finishedAt));
        } else if (!this.completed && previousEnd) {
            this.raceHandler.allPlayersNotFinished();
            this.sendRoomData();
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

        const player = this.getPlayerById(
            `${isSession ? 'session' : 'user'}:${user}`,
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
        const player = this.getPlayerById(authToken.playerId);
        if (!player) {
            this.logWarn('Unable to find a player for a verified room token');
            return false;
        }
        this.logInfo(`Connecting ${player.nickname} to racetime`);
        return player.joinRace();
    }

    leaveRaceRoom(authToken: RoomTokenPayload) {
        const player = this.getPlayerById(authToken.playerId);
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
        const player = this.getPlayerById(roomAuth.playerId);
        if (!player) {
            this.logWarn('Unable to find a player for a verified room token');
            return false;
        }
        this.logInfo(`Readying ${player.nickname} to race`);
        return player.ready();
    }

    unreadyPlayer(roomAuth: RoomTokenPayload) {
        const player = this.getPlayerById(roomAuth.playerId);
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
        this.emit('room:inactivityWarning');
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
    private closing = false;

    close() {
        if (this.closing) return;
        this.closing = true;
        this.logInfo('Closing room.');
        this.emit('room:closing');
        this.getAllPlayers().forEach((player) => {
            player.connections.forEach((connection) => {
                this.handleSocketClose(connection);
                connection.close(1001, 'Room is closing.');
            });
        });
        allRooms.delete(this.slug);
        this.emit('room:closed');
    }

    revealCardForPlayer(player: Player) {
        const timestamp = new Date();
        this.markActive();
        player.boardHidden = false;
        this.emit('board:revealed', player, timestamp);
    }

    revealCardForAllPlayers() {
        this.getAllPlayers().forEach((player) => {
            this.revealCardForPlayer(player);
        });
    }

    computeVictoryMasks() {
        const width = this.boardWidth;
        const height = this.boardHeight;
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
