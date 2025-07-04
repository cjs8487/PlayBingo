'use client';
import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
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
import { Board, Cell } from '@playbingo/types';
import { RoomData } from '@playbingo/types';
import { ChatMessage, Player, ServerMessage } from '@playbingo/types';
import { alertError } from '../lib/Utils';
import { Box, Link, Typography } from '@mui/material';
import NextLink from 'next/link';

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
    connect: (
        nickname: string,
        password: string,
        spectator: boolean,
    ) => Promise<{ success: boolean; message?: string }>;
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
    showGoalDetails: false,
    showCounters: false,
    async connect() {
        return { success: false };
    },
    sendChatMessage(message) {},
    markGoal(row, col) {},
    unmarkGoal(row, col) {},
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
    slug: string;
    children: ReactNode;
}

export function RoomContextProvider({ slug, children }: RoomContextProps) {
    // state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [connectionStatusState, setConnectionStatus] = useState(
        ConnectionStatus.UNINITIALIZED,
    );
    const [authToken, setAuthToken] = useState<string>();
    const [nickname, setNickname] = useState('');
    const [color, setColor] = useState('blue');
    const [roomData, setRoomData] = useState<RoomData>();
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState<Player[]>([]);

    const [notFound, setNotFound] = useState(false);

    const [starredGoals, { push, clear, filter }] = useList<number>([]);

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
        (
            board: Board,
            chatHistory: ChatMessage[],
            roomData: RoomData,
            nickname?: string,
            color?: string,
        ) => {
            if (nickname) {
                setNickname(nickname);
            }
            if (color) {
                setColor(color);
            }
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
        localStorage.removeItem(`authToken-${slug}`);
    }, [slug]);
    const onUpdateRoomData = useCallback((roomData: RoomData) => {
        setRoomData(roomData);
    }, []);

    // websocket
    const { sendJsonMessage } = useWebSocket(
        `${websocketBase}/socket/${slug}`,
        {
            share: true,
            heartbeat: {
                interval: 60 * 1000,
                message: 'ping',
                returnMessage: 'pong',
                timeout: 2 * 60 * 1000,
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
                            payload.nickname,
                            payload.color,
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
                console.log('closing ws connection');
            },
        },
        connectionStatus === ConnectionStatus.CONNECTING ||
            connectionStatus === ConnectionStatus.CONNECTED,
    );

    // actions
    const join = useCallback(
        (token: string, nickname?: string) => {
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
            const res = await fetch(`/api/rooms/${slug}/authorize`, {
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
            localStorage.setItem(`authToken-${slug}`, token.authToken);
            setConnectionStatus(ConnectionStatus.CONNECTING);
            setNickname(nickname);
            join(token.authToken, nickname);
            return { success: true };
        },
        [slug, join],
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
        const res = await fetch(`/api/rooms/${slug}/actions`, {
            method: 'POST',
            body: JSON.stringify({
                action: 'racetime/create',
                authToken,
            }),
        });
        if (!res.ok) {
            alertError(await res.text());
            return;
        }
    }, [roomData, authToken]);
    const updateRacetimeRoom = useCallback(async () => {
        const res = await fetch(`/api/rooms/${slug}/actions`, {
            method: 'POST',
            body: JSON.stringify({ action: 'racetime/refresh', authToken }),
        });
        if (!res.ok) {
            alertError(await res.text());
            return;
        }
    }, [roomData, authToken]);
    const joinRacetimeRoom = useCallback(async () => {
        const res = await fetch(`/api/rooms/${slug}/actions`, {
            method: 'POST',
            body: JSON.stringify({
                action: 'racetime/join',
                authToken,
            }),
        });
        if (!res.ok) {
            alertError(await res.text());
            return;
        }
    }, [roomData, authToken]);
    const racetimeReady = useCallback(async () => {
        const res = await fetch(`/api/rooms/${slug}/actions`, {
            method: 'POST',
            body: JSON.stringify({
                action: 'racetime/ready',
                authToken,
            }),
        });
        if (!res.ok) {
            alertError(await res.text());
            return;
        }
    }, [roomData, authToken]);
    const racetimeUnready = useCallback(async () => {
        const res = await fetch(`/api/rooms/${slug}/actions`, {
            method: 'POST',
            body: JSON.stringify({ action: 'racetime/unready', authToken }),
        });
        if (!res.ok) {
            alertError(await res.text());
            return;
        }
    }, [roomData, authToken]);
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

    // effects
    // slug changed, try to establish initial connection from storage
    useEffect(() => {
        async function checkRoom() {
            const res = await fetch(`/api/rooms/${slug}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setNotFound(true);
                } else {
                    const error = await res.text();
                    alertError(`Unable to load room data - ${error}`);
                }
                return;
            }
            if (connectionStatus === ConnectionStatus.UNINITIALIZED) {
                // load a cached token and use it if present
                const storedToken = localStorage.getItem(`authToken-${slug}`);
                const tempNickname = localStorage.getItem(
                    'PlayBingo.temp.nickname',
                );
                localStorage.removeItem('PlayBingo.temp.nickname');
                if (storedToken) {
                    setAuthToken(storedToken);
                    if (tempNickname) {
                        setNickname(tempNickname);
                    }
                    setConnectionStatus(ConnectionStatus.CONNECTING);
                    join(storedToken, tempNickname ?? undefined);
                }
            }
        }
        checkRoom();
        setLoading(false);
    }, [slug, connectionStatus, join]);

    // prevent UI flash when restoring from local storage due to SSR, reducing
    // the number of re-renders for the room page since all the state changes
    // after connection will usually be batched
    if (loading) {
        return 'loading...';
    }

    if (notFound) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexGrow: 1,
                    p: 5,
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        pb: 2,
                    }}
                >
                    Not Found
                </Typography>
                <Typography>The room {slug} couldn&#39;t be found.</Typography>
                <Box
                    sx={{
                        pt: 0.5,
                    }}
                >
                    <Link href="/rooms" component={NextLink}>
                        ← Return to room list
                    </Link>
                </Box>
            </Box>
        );
    }

    return (
        <RoomContext.Provider
            value={{
                connectionStatus,
                board,
                messages,
                color,
                roomData,
                nickname,
                players,
                starredGoals,
                showGoalDetails,
                showCounters,
                connect,
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
