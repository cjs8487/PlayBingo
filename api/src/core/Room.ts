import { Goal } from '@prisma/client';
import { OPEN, WebSocket } from 'ws';
import { logError, logInfo, logWarn } from '../Logger';
import { RoomTokenPayload, invalidateToken } from '../auth/RoomAuth';
import {
    addChangeColorAction,
    addChatAction,
    addJoinAction,
    addLeaveAction,
    addMarkAction,
    addUnmarkAction,
    setRoomBoard,
} from '../database/Rooms';
import {
    getDifficultyGroupCount,
    getDifficultyVariant,
} from '../database/games/Games';
import { goalsForGame } from '../database/games/Goals';
import {
    ChangeColorAction,
    ChatAction,
    JoinAction,
    LeaveAction,
    MarkAction,
    NewCardAction,
    UnmarkAction,
} from '../types/RoomAction';
import {
    ChatMessage,
    Player,
    RevealedBoard,
    ServerMessage,
} from '../types/ServerMessage';
import { shuffle } from '../util/Array';
import { listToBoard } from '../util/RoomUtils';
import { generateFullRandom } from './generation/Random';
import { generateSRLv5 } from './generation/SRLv5';
import RacetimeHandler, { RaceData } from './integration/RacetimeHandler';

type RoomIdentity = {
    nickname: string;
    color: string;
    racetimeId?: string;
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
    connections: Map<string, WebSocket>;
    board: RevealedBoard;
    identities: Map<string, RoomIdentity>;
    chatHistory: ChatMessage[];
    id: string;
    hideCard: boolean;

    lastGenerationMode: BoardGenerationOptions;

    racetimeEligible: boolean;
    racetimeHandler: RacetimeHandler;

    constructor(
        name: string,
        game: string,
        gameSlug: string,
        slug: string,
        password: string,
        id: string,
        hideCard: boolean,
        racetimeEligible: boolean,
        racetimeUrl?: string,
    ) {
        this.name = name;
        this.game = game;
        this.gameSlug = gameSlug;
        this.password = password;
        this.slug = slug;
        this.identities = new Map();
        this.connections = new Map();
        this.chatHistory = [];
        this.id = id;

        this.lastGenerationMode = { mode: BoardGenerationMode.RANDOM };

        this.racetimeEligible = !!racetimeEligible;
        this.racetimeHandler = new RacetimeHandler(this);

        this.board = {
            board: [],
            hidden: false,
        };

        if (racetimeUrl) {
            this.racetimeHandler.connect(racetimeUrl);
        }

        this.hideCard = hideCard;
    }

    async generateBoard(options: BoardGenerationOptions) {
        this.lastGenerationMode = options;
        const { mode, seed } = options;
        const goals = await goalsForGame(this.gameSlug);
        let goalList: Goal[];
        try {
            switch (mode) {
                case BoardGenerationMode.SRLv5:
                    goalList = generateSRLv5(goals, seed);
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

                    const maxDifficulty = goals.reduce<number>((max, goal) => {
                        if (goal.difficulty && goal.difficulty > max) {
                            return goal.difficulty;
                        }
                        return max;
                    }, 0);
                    const groupSize = maxDifficulty / numGroups;
                    const emptyGroupedGoals = [];
                    for (let i = 0; i < numGroups; i++) {
                        emptyGroupedGoals.push([]);
                    }
                    const groupedGoals = goals.reduce<Goal[][]>(
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
                default:
                    goalList = generateFullRandom(goals, seed);
                    break;
            }
        } catch (e) {
            this.logError(`Failed to generate board ${e}`);
            return;
        }

        this.board = { board: listToBoard(goalList) };
        this.sendSyncBoard();
        setRoomBoard(
            this.id,
            this.board.board
                .flat()
                .map((cell) => `${cell.goal}::${cell.description}`),
        );
    }

    getPlayers() {
        const players: Player[] = [];
        this.identities.forEach((i) => {
            const rtUser = this.racetimeHandler.getPlayer(i.racetimeId ?? '');
            players.push({
                nickname: i.nickname,
                color: i.color,
                goalCount: this.board.board.reduce((prev, row) => {
                    return (
                        prev +
                        row.reduce((p, cell) => {
                            if (cell.colors.includes(i.color)) {
                                return p + 1;
                            }
                            return p;
                        }, 0)
                    );
                }, 0),
                racetimeStatus: rtUser
                    ? {
                          connected: true,
                          username: rtUser.user.full_name,
                          status: rtUser.status.verbose_value,
                          finishTime: rtUser.finish_time ?? undefined,
                      }
                    : { connected: false },
            });
        });
        return players;
    }

    //#region Handlers
    handleJoin(
        action: JoinAction,
        auth: RoomTokenPayload,
        socket: WebSocket,
    ): ServerMessage {
        let identity: RoomIdentity | undefined;
        if (action.payload) {
            identity = {
                nickname: action.payload.nickname,
                color: 'blue',
            };
            this.identities.set(auth.uuid, identity);
        } else {
            identity = this.identities.get(auth.uuid);
            if (!identity) {
                return { action: 'unauthorized' };
            }
        }
        this.sendChat([
            { contents: identity.nickname, color: identity.color },
            ' has joined.',
        ]);

        this.connections.set(auth.uuid, socket);
        addJoinAction(this.id, identity.nickname, identity.color).then();
        return {
            action: 'connected',
            board: this.hideCard ? { hidden: true } : this.board,
            chatHistory: this.chatHistory,
            nickname: identity.nickname,
            color: identity.color,
            roomData: {
                game: this.game,
                slug: this.slug,
                name: this.name,
                gameSlug: this.gameSlug,
                racetimeConnection: {
                    gameActive: this.racetimeEligible,
                    url: this.racetimeHandler.url,
                    startDelay: this.racetimeHandler.data?.start_delay,
                    started: this.racetimeHandler.data?.started_at ?? undefined,
                    ended: this.racetimeHandler.data?.ended_at ?? undefined,
                    status: this.racetimeHandler.data?.status.verbose_value,
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
        const identity = this.identities.get(auth.uuid);
        if (!identity) {
            return { action: 'unauthorized' };
        }
        this.sendChat([
            { contents: identity.nickname, color: identity.color },
            ' has left.',
        ]);
        invalidateToken(token);
        this.identities.delete(auth.uuid);
        this.connections.delete(auth.uuid);
        addLeaveAction(this.id, identity.nickname, identity.color).then();
        return { action: 'disconnected' };
    }

    handleChat(
        action: ChatAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const identity = this.identities.get(auth.uuid);
        if (!identity) {
            return { action: 'unauthorized' };
        }
        const { message: chatMessage } = action.payload;
        if (!chatMessage) return;
        this.sendChat(`${identity.nickname}: ${chatMessage}`);
        addChatAction(
            this.id,
            identity.nickname,
            identity.color,
            chatMessage,
        ).then();
    }

    handleMark(
        action: MarkAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const identity = this.identities.get(auth.uuid);
        if (!identity) {
            return { action: 'unauthorized' };
        }
        const { row, col } = action.payload;
        if (row === undefined || col === undefined) return;
        if (this.board.board[row][col].colors.includes(identity.color)) return;
        this.board.board[row][col].colors.push(identity.color);
        this.board.board[row][col].colors.sort((a, b) => a.localeCompare(b));
        this.sendCellUpdate(row, col);
        this.sendChat([
            {
                contents: identity.nickname,
                color: identity.color,
            },
            ` is marking (${row},${col})`,
        ]);
        addMarkAction(
            this.id,
            identity.nickname,
            identity.color,
            row,
            col,
        ).then();
    }

    handleUnmark(
        action: UnmarkAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const identity = this.identities.get(auth.uuid);
        if (!identity) {
            return { action: 'unauthorized' };
        }
        const { row: unRow, col: unCol } = action.payload;
        if (unRow === undefined || unCol === undefined) return;
        this.board.board[unRow][unCol].colors = this.board.board[unRow][
            unCol
        ].colors.filter((color) => color !== identity.color);
        this.sendCellUpdate(unRow, unCol);
        this.sendChat([
            { contents: identity.nickname, color: identity.color },
            ` is unmarking (${unRow},${unCol})`,
        ]);
        addUnmarkAction(
            this.id,
            identity.nickname,
            identity.color,
            unRow,
            unCol,
        ).then();
    }

    handleChangeColor(
        action: ChangeColorAction,
        auth: RoomTokenPayload,
    ): ServerMessage | undefined {
        const identity = this.identities.get(auth.uuid);
        if (!identity) {
            return { action: 'unauthorized' };
        }
        const { color } = action.payload;
        if (!color) {
            return;
        }
        this.identities.set(auth.uuid, {
            ...identity,
            color,
        });
        this.sendChat([
            { contents: identity.nickname, color: identity.color },
            ' has changed their color to ',
            { contents: color, color },
        ]);
        addChangeColorAction(
            this.id,
            identity.nickname,
            identity.color,
            color,
        ).then();
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
        let socketKey;
        this.connections.forEach((v, k) => {
            if (v === ws) {
                socketKey = k;
            }
        });
        if (socketKey) {
            const identity = this.identities.get(socketKey);
            this.connections.delete(socketKey);
            if (!identity) return true;
            this.sendChat([
                { contents: identity.nickname, color: identity.color },
                'has left.',
            ]);
            addLeaveAction(this.id, identity.nickname, identity.color).then();
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
            },
        });
        this.sendChat(`Racetime.gg room created ${url}`);
        this.racetimeHandler.connect(url);
        this.racetimeHandler.connectWebsocket();
    }

    handleRacetimeRoomDisconnected() {
        this.racetimeHandler.disconnect();
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
            },
        });
    }

    handleRevealCard(payload: RoomTokenPayload) {
        const identity = this.identities.get(payload.uuid);
        if (!identity) {
            return null;
        }
        this.sendChat([
            {
                contents: identity.nickname,
                color: identity.color,
            },
            'has revealed the card.',
        ]);
        return this.board;
    }
    //#endregion

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
                url: this.racetimeHandler.url,
                startDelay: data.start_delay ?? undefined,
                started: data.started_at ?? undefined,
                ended: data.ended_at ?? undefined,
                status: data.status.verbose_value,
            },
        });
    }

    private sendServerMessage(message: ServerMessage) {
        this.connections.forEach((client) => {
            if (client.readyState === OPEN) {
                client.send(
                    JSON.stringify({ ...message, players: this.getPlayers() }),
                );
            }
        });
    }

    //#region Racetime Integration
    async connectRacetimeWebSocket() {
        this.racetimeHandler.connectWebsocket();
    }

    joinRacetimeRoom(
        token: string,
        racetimeId: string,
        authToken: RoomTokenPayload,
    ) {
        const identity = this.identities.get(authToken.uuid);
        if (!identity) {
            this.logWarn(
                'Unable to find an identity for a verified room token',
            );
            return false;
        }
        this.logInfo(`Connecting ${identity.nickname} to racetime`);
        this.identities.set(authToken.uuid, {
            ...identity,
            racetimeId: racetimeId,
        });
        return this.racetimeHandler.joinUser(token);
    }

    async refreshRacetimeHandler() {
        this.racetimeHandler.refresh();
    }

    readyPlayer(token: string, roomAuth: RoomTokenPayload) {
        const identity = this.identities.get(roomAuth.uuid);
        if (!identity) {
            this.logWarn(
                'Unable to find an identity for a verified room token',
            );
            return false;
        }
        this.logInfo(`Readying ${identity.nickname} to race`);
        return this.racetimeHandler.ready(token);
    }

    unreadyPlayer(token: string, roomAuth: RoomTokenPayload) {
        const identity = this.identities.get(roomAuth.uuid);
        if (!identity) {
            this.logWarn(
                'Unable to find an identity for a verified room token',
            );
            return false;
        }
        this.logInfo(`Readying ${identity.nickname} to race`);
        return this.racetimeHandler.unready(token);
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
}
