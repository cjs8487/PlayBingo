import type {
    Board,
    Cell,
    RevealedBoard,
    ServerMessage,
} from '@playbingo/types';
import { useCallback, useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

const board = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
];

const slug = 'tender-lilac-1869';
const websocketBase = `ws://localhost:8001/socket/${slug}`;

export function App() {
    const [authToken, setAuthToken] = useState('');
    const [board, setBoard] = useState<RevealedBoard>();

    console.log(authToken);

    const onCellUpdate = useCallback(
        (row: number, col: number, cellData: Cell) => {
            setBoard((curr) => {
                if (curr) {
                    curr.board[row][col] = cellData;
                }
                return curr;
            });
        },
        [],
    );
    const onSyncBoard = useCallback((board: RevealedBoard) => {
        setBoard(board);
    }, []);
    const onConnected = useCallback((board: RevealedBoard) => {
        setBoard(board);
    }, []);

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
                console.log('websocket message');
                console.log(message);
                if (message.data === 'pong') return;
                const payload = JSON.parse(message.data) as ServerMessage;
                if (!payload.action) {
                    return;
                }
                if (payload.players) {
                    // setPlayers(payload.players);
                }
                switch (payload.action) {
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
                        if (payload.board.hidden) return;
                        onSyncBoard(payload.board);
                        break;
                    case 'connected':
                        if (
                            !payload.board ||
                            !payload.chatHistory ||
                            !payload.roomData ||
                            payload.board.hidden
                        )
                            return;
                        onConnected(payload.board);
                        break;
                }
            },
            onClose() {
                setAuthToken('');
                console.log('closing ws connection');
            },
        },
        authToken !== '',
    );

    console.log(board);

    useEffect(() => {
        window.Twitch.ext.onAuthorized(async (auth) => {
            console.log(auth);

            const res = await fetch(
                `http://localhost:8001/api/twitch/ebs/${slug}/authorize`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application-json' },
                },
            );
            if (!res.ok) {
                return;
            }
            const { authToken } = await res.json();
            setAuthToken(authToken);
        });
    }, []);

    useEffect(() => {
        sendJsonMessage({
            action: 'join',
            authToken: authToken,
            payload: { nickname: 'twitch viewer' },
        });
    }, [authToken]);

    if (!board) {
        return null;
    }

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplate: `repeat(${board.board.length}, 1fr) / repeat(${board.board[0].length}, 1fr)`,
                flexDirection: 'column',
                backgroundColor: 'purple',
            }}
        >
            {board?.board.map((row) => (
                <>
                    {row.map((cell) => (
                        <div
                            style={{
                                flexGrow: 1,
                                border: '1px solid black',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                padding: '8px',
                            }}
                        >
                            {cell.goal}
                        </div>
                    ))}
                </>
            ))}
        </div>
    );
}
