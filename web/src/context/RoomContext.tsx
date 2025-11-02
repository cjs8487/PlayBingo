'use client';
import {
    Board,
    Cell,
    ChatMessage,
    Game,
    Player,
    RoomData,
    ServerMessage,
} from '@playbingo/types';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from 'react';
import { useLatest, useList } from 'react-use';
import useWebSocket from 'react-use-websocket';
import {
    emitBoardUpdate,
    getBoardSnapshot,
    getServerSnapshot,
    subscribeToBoardUpdates,
} from '../lib/BoardStore';
import { alertError } from '../lib/Utils';
import { useUserContext } from './UserContext';
import { useApi } from '@/lib/Hooks';

const websocketBase = (process.env.NEXT_PUBLIC_API_PATH ?? '').replace(
    'http',
    'ws',
);

export enum ConnectionStatus {
    UNINITIALIZED, // the room connection is uninitialized and there is no authentication data present
    CONNECTING, // the server has confirmed the password, but has not yet confirmed the room connection
    CONNECTED, // actively connected to the server with valid authentication
    UNAUTHORIZED, // received an unauthorized message from the server
    CLOSING, // the connection is in the process of closing
    CLOSED, // connection was manually closed, and the user is completely disconnected
}

interface CardRegenerateOptions {
    seed?: number;
    generationMode?: string;
}

interface RoomContext {
    connectionStatus: ConnectionStatus;
    board: Board;
    messages: ChatMessage[];
    color: string;
    roomData?: RoomData;
    nickname: string;
    players: Player[];
    starredGoals: number[];
    showGoalDetails: boolean;
    showCounters: boolean;
    language: string;
    availableLanguages: string[];
    defaultLanguage: string;
    connectedPlayer?: Player;
    colorMap: { [k: string]: string };
    connect: (
        nickname: string,
        password: string,
        spectator: boolean,
    ) => Promise<{ success: boolean; message?: string }>;
    setLanguage: (language: string) => void;
    sendChatMessage: (message: string) => void;
    markGoal: (row: number, col: number) => void;
    unmarkGoal: (row: number, col: number) => void;
    changeColor: (color: string) => void;
    regenerateCard: (options?: CardRegenerateOptions) => void;
    disconnect: () => void;
    createRacetimeRoom: () => void;
    updateRacetimeRoom: () => void;
    joinRacetimeRoom: () => void;
    racetimeReady: () => void;
    racetimeUnready: () => void;
    toggleGoalStar: (row: number, col: number) => void;
    revealCard: () => void;
    toggleGoalDetails: () => void;
    toggleCounters: () => void;
}

export const RoomContext = createContext<RoomContext>({
    connectionStatus: ConnectionStatus.UNINITIALIZED,
    board: { board: [] },
    messages: [],
    color: 'blue',
    nickname: '',
    players: [],
    starredGoals: [],
    language: '',
    defaultLanguage: '',
    availableLanguages: [],
    showGoalDetails: false,
    showCounters: false,
    colorMap: {},
    async connect() {
        return { success: false };
    },
    setLanguage() {},
    sendChatMessage() {},
    markGoal() {},
    unmarkGoal() {},
    changeColor() {},
    regenerateCard() {},
    disconnect() {},
    createRacetimeRoom() {},
    updateRacetimeRoom() {},
    joinRacetimeRoom() {},
    racetimeReady() {},
    racetimeUnready() {},
    toggleGoalStar() {},
    revealCard() {},
    toggleGoalDetails() {},
    toggleCounters() {},
});

interface RoomContextProps {
    children: ReactNode;
    serverRoomData: RoomData;
}

export function RoomContextProvider({
    children,
    serverRoomData,
}: RoomContextProps) {
    const { user } = useUserContext();

    // state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [roomData, setRoomData] = useState<RoomData>(serverRoomData);

    const [authToken, setAuthToken] = useState<string>(
        serverRoomData.token ?? '',
    );
    const [nickname, setNickname] = useState(
        localStorage.getItem('PlayBingo.temp.nickname') ??
            (serverRoomData.token ? user?.username : '') ??
            '',
    );
    const [color, setColor] = useState('blue');
    const [connectionStatusState, setConnectionStatus] = useState(
        //if there is already an auth token present, start the connection
        //process automatically
        authToken
            ? ConnectionStatus.CONNECTING
            : ConnectionStatus.UNINITIALIZED,
    );
    const [players, setPlayers] = useState<Player[]>([]);
    const [language, setLanguage] = useState('');
    const [connectedPlayer, setConnectedPlayer] = useState<Player>();
    const colorMap = useMemo(() => {
        const colorMap: { [k: string]: string } = {};
        players.forEach((player) => (colorMap[player.id] = player.color));
        return colorMap;
    }, [players]);

    const [starredGoals, { push, filter }] = useList<number>([]);

    const [showGoalDetails, setShoWGoalDetails] = useState(false);

    const latestConnectionStatus = useLatest(connectionStatusState);
    const connectionStatus = latestConnectionStatus.current;

    // const [board, dispatchBoard] = useReducer(boardReducer, { board: [] });
    const board = useSyncExternalStore(
        subscribeToBoardUpdates,
        getBoardSnapshot,
        getServerSnapshot,
    );

    const [showCounters, setShowCounters] = useState(false);
    const toggleCounters = useCallback(() => {
        setShowCounters((curr) => !curr);
    }, []);

    // incoming messages
    const onChatMessage = useCallback((message: ChatMessage) => {
        setMessages((curr) => [...curr, message]);
    }, []);
    const onCellUpdate = useCallback(
        (row: number, col: number, cellData: Cell) => {
            emitBoardUpdate({ action: 'cell', row, col, cell: cellData });
        },
        [],
    );
    const onSyncBoard = useCallback((board: Board) => {
        emitBoardUpdate({ action: 'board', board });
    }, []);
    const onConnected = useCallback(
        (board: Board, chatHistory: ChatMessage[], roomData: RoomData) => {
            emitBoardUpdate({ action: 'board', board });
            setMessages(chatHistory);
            setConnectionStatus(ConnectionStatus.CONNECTED);
            setRoomData(roomData);
        },
        [],
    );
    const onUnauthorized = useCallback(() => {
        setAuthToken('');
        setConnectionStatus(ConnectionStatus.UNAUTHORIZED);
        localStorage.removeItem(`authToken-${roomData.slug}`);
    }, [roomData.slug]);
    const onUpdateRoomData = useCallback((roomData: RoomData) => {
        setRoomData(roomData);
    }, []);

    const { data: gameData, isLoading: loadingGames } = useApi<Game>(
        `/api/games/${roomData.gameSlug}`,
    );

    // websocket
    const { sendJsonMessage } = useWebSocket(
        `${websocketBase}/socket/${roomData.slug}`,
        {
            share: true,
            heartbeat: {
                interval: 60 * 1000,
                message: 'ping',
                returnMessage: 'pong',
                timeout: 2 * 60 * 1000,
            },
            onOpen() {
                join(authToken, nickname);
            },
            onMessage(message) {
                if (message.data === 'pong') return;
                const payload = JSON.parse(message.data) as ServerMessage;
                if (!payload.action) {
                    return;
                }
                if (payload.players) {
                    setPlayers(payload.players);
                }
                if (payload.connectedPlayer) {
                    setConnectedPlayer(payload.connectedPlayer);
                }
                switch (payload.action) {
                    case 'chat':
                        if (!payload.message) return;
                        onChatMessage(payload.message);
                        break;
                    case 'cellUpdate':
                        if (
                            payload.row === undefined ||
                            payload.col === undefined ||
                            !payload.cell
                        )
                            return;
                        onCellUpdate(payload.row, payload.col, payload.cell);
                        break;
                    case 'syncBoard':
                        if (!payload.board) return;
                        onSyncBoard(payload.board);
                        break;
                    case 'connected':
                        if (
                            !payload.board ||
                            !payload.chatHistory ||
                            !payload.roomData
                        )
                            return;
                        onConnected(
                            payload.board,
                            payload.chatHistory,
                            payload.roomData,
                        );
                        break;
                    case 'unauthorized':
                        onUnauthorized();
                        break;
                    case 'updateRoomData':
                        if (!payload.roomData) {
                            return;
                        }
                        onUpdateRoomData(payload.roomData);
                        break;
                    case 'syncRaceData':
                        if (roomData) {
                            onUpdateRoomData({
                                ...roomData,
                                racetimeConnection: payload.racetimeConnection,
                            });
                        }
                        break;
                }
            },
            onClose() {
                setAuthToken('');
                setConnectionStatus(ConnectionStatus.CLOSED);
            },
        },
        connectionStatus === ConnectionStatus.CONNECTING ||
            connectionStatus === ConnectionStatus.CONNECTED,
    );

    // actions
    const join = useCallback(
        (token: string, nickname?: string) => {
            setConnectionStatus(ConnectionStatus.CONNECTING);
            sendJsonMessage({
                action: 'join',
                authToken: token,
                payload: nickname ? { nickname } : undefined,
            });
        },
        [sendJsonMessage],
    );
    const connect = useCallback(
        async (nickname: string, password: string, spectator: boolean) => {
            const res = await fetch(`/api/rooms/${roomData.slug}/authorize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, spectator }),
            });
            if (!res.ok) {
                if (res.status === 403) {
                    return { success: false, message: 'Incorrect password' };
                }
                return {
                    success: false,
                    message: 'An error occurred while processing your request.',
                };
            }
            const token = await res.json();
            setAuthToken(token.authToken);
            localStorage.setItem(`authToken-${roomData.slug}`, token.authToken);
            setConnectionStatus(ConnectionStatus.CONNECTING);
            setNickname(nickname);
            join(token.authToken, nickname);
            return { success: true };
        },
        [roomData.slug, join],
    );
    const disconnect = useCallback(async () => {
        sendJsonMessage({ action: 'leave', authToken });
    }, [authToken, sendJsonMessage]);
    const sendChatMessage = useCallback(
        (message: string) => {
            sendJsonMessage({
                action: 'chat',
                authToken,
                payload: {
                    message,
                },
            });
        },
        [authToken, sendJsonMessage],
    );
    const markGoal = useCallback(
        (row: number, col: number) => {
            sendJsonMessage({
                action: 'mark',
                authToken,
                payload: {
                    row,
                    col,
                },
            });
        },
        [authToken, sendJsonMessage],
    );
    const unmarkGoal = useCallback(
        (row: number, col: number) => {
            sendJsonMessage({
                action: 'unmark',
                authToken,
                payload: {
                    row,
                    col,
                },
            });
        },
        [authToken, sendJsonMessage],
    );
    const changeColor = useCallback(
        (color: string) => {
            setColor(color);
            sendJsonMessage({
                action: 'changeColor',
                authToken,
                payload: { color },
            });
        },
        [authToken, sendJsonMessage],
    );
    const regenerateCard = useCallback(
        (options?: CardRegenerateOptions) => {
            const { seed, generationMode } = options ?? {};
            sendJsonMessage({
                action: 'newCard',
                authToken,
                options: { seed, mode: generationMode },
            });
        },
        [authToken, sendJsonMessage],
    );
    const createRacetimeRoom = useCallback(async () => {
        if (!connectedPlayer?.monitor) {
            return;
        }
        const res = await fetch(`/api/rooms/${roomData.slug}/actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'racetime/create',
                authToken,
            }),
        });
        if (!res.ok) {
            alertError(await res.text());
            return;
        }
    }, [roomData, authToken, connectedPlayer]);
    const updateRacetimeRoom = useCallback(async () => {
        const res = await fetch(`/api/rooms/${roomData.slug}/actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'racetime/refresh', authToken }),
        });
        if (!res.ok) {
            alertError(await res.text());
            return;
        }
    }, [roomData, authToken]);
    const joinRacetimeRoom = useCallback(async () => {
        if (connectedPlayer?.spectator) {
            return;
        }
        const res = await fetch(`/api/rooms/${roomData.slug}/actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'racetime/join',
                authToken,
            }),
        });
        if (!res.ok) {
            alertError(await res.text());
            return;
        }
    }, [roomData, authToken, connectedPlayer]);
    const racetimeReady = useCallback(async () => {
        if (connectedPlayer?.spectator) {
            return;
        }
        const res = await fetch(`/api/rooms/${roomData.slug}/actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'racetime/ready',
                authToken,
            }),
        });
        if (!res.ok) {
            alertError(await res.text());
            return;
        }
    }, [roomData, authToken, connectedPlayer]);
    const racetimeUnready = useCallback(async () => {
        if (connectedPlayer?.spectator) {
            return;
        }
        const res = await fetch(`/api/rooms/${roomData.slug}/actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'racetime/unready', authToken }),
        });
        if (!res.ok) {
            alertError(await res.text());
            return;
        }
    }, [roomData, authToken, connectedPlayer]);
    const toggleGoalStar = useCallback(
        (row: number, col: number) => {
            const index = row * 5 + col;
            if (starredGoals.includes(index)) {
                filter((idx) => idx !== index);
            } else {
                push(index);
            }
        },
        [starredGoals, push, filter],
    );
    const revealCard = useCallback(() => {
        sendJsonMessage({ action: 'revealCard', authToken });
    }, [sendJsonMessage, authToken]);
    const toggleGoalDetails = useCallback(() => {
        setShoWGoalDetails((curr) => {
            return !curr;
        });
    }, []);

    useEffect(() => {
        if (gameData?.defaultLanguage && !language) {
            setLanguage(gameData.defaultLanguage);
        }
    }, [gameData?.defaultLanguage, language]);

    if (!gameData || loadingGames) {
        return null;
    }

    const availableLanguages = gameData?.translations || [];
    const defaultLanguage = gameData?.defaultLanguage || '';

    return (
        <RoomContext.Provider
            value={{
                connectionStatus,
                board,
                messages,
                language,
                defaultLanguage,
                availableLanguages,
                color,
                roomData,
                nickname,
                players,
                starredGoals,
                showGoalDetails,
                showCounters,
                connectedPlayer,
                colorMap,
                connect,
                setLanguage,
                sendChatMessage,
                markGoal,
                unmarkGoal,
                changeColor,
                regenerateCard,
                disconnect,
                createRacetimeRoom,
                updateRacetimeRoom,
                joinRacetimeRoom,
                racetimeReady,
                racetimeUnready,
                toggleGoalStar,
                revealCard,
                toggleGoalDetails,
                toggleCounters,
            }}
        >
            {children}
        </RoomContext.Provider>
    );
}

export function useRoomContext() {
    return useContext(RoomContext);
}
