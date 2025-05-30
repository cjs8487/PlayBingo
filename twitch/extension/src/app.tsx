import type { Cell, RevealedBoard, ServerMessage } from '@playbingo/types';
import { useCallback, useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

const slug = 'tender-lilac-1869';
const websocketBase = `ws://localhost:8001/socket/${slug}`;

export function App() {
    const [authToken, setAuthToken] = useState('');
    const [board, setBoard] = useState<RevealedBoard>();
    const [error, setError] = useState(0);

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

    useEffect(() => {
        window.Twitch.ext.onAuthorized(async (auth) => {
            const res = await fetch(
                `http://localhost:8001/api/twitch/ebs/${slug}/authorize`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application-json',
                        Authorization: `Bearer ${auth.token}`,
                    },
                },
            );
            if (!res.ok) {
                setError(res.status);
                return;
            }
            setError(0);
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

    console.log(error);
    if (error) {
        let text = '';
        switch (error) {
            case 403:
                text =
                    'Unable to authorize the extension with the PlayBingo server. Try refreshing the page.';
                break;
            case 404:
                text =
                    "The bingo room this streamer has configured couldn't be found. Try refreshing the page. If this error persists, ask the streamer to make sure they connected the room to their Twitch account.";
                break;
            case 500:
                text =
                    'An error occurred on the PlayBingo server while trying to connect, but no additional details are available. Try refreshing the page.';
        }
        return (
            <div style={{ color: 'white ', fontSize: 'x-large' }}>{text}</div>
        );
    }

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
