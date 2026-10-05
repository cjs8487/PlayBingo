'use client';
import { RoomContext } from '@/context/RoomContext';
import SendIcon from '@mui/icons-material/Send';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { ChatMessage, ServerMessage } from '@playbingo/types';
import { DateTime, Duration } from 'luxon';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

function eventMessage(
    event: ServerMessage,
    mode?: string,
): ChatMessage | undefined {
    switch (event.action) {
        case 'chatSent':
        case 'system:message':
            return event.message;
        case 'players:join':
            return event.player.spectator
                ? [`${event.player.nickname} is now spectating`]
                : [
                      {
                          contents: event.player.nickname,
                          color: event.player.color,
                      },
                      ' has joined.',
                  ];
        case 'players:leave':
            return [
                { contents: event.player.nickname, color: event.player.color },
                ' has left.',
            ];
        case 'player:colorChanged':
            return [
                { contents: event.player.nickname, color: event.newColor },
                ' has changed their color to ',
                { contents: event.newColor, color: event.newColor },
            ];
        case 'board:goalMarked':
        case 'board:goalUnmarked':
            return [
                { contents: event.player.nickname, color: event.player.color },
                ` ${event.action === 'board:goalMarked' ? 'marked' : 'unmarked'} ${event.cell.revealed ? event.cell.goal.goal : 'a hidden goal'} (${event.row},${event.col})`,
            ];
        case 'board:revealed':
            return [
                { contents: event.player.nickname, color: event.player.color },
                ' has revealed the card.',
            ];
        case 'board:regenerated':
            return ['The card has been regenerated.'];
        case 'player:finished':
            return [
                { contents: event.player.nickname, color: event.player.color },
                mode === 'Lockout'
                    ? ' has achieved lockout!'
                    : mode === 'Blackout'
                      ? ' has achieved blackout!'
                      : ' has completed the goal!',
            ];
        case 'player:unfinished':
            return [
                { contents: event.player.nickname, color: event.player.color },
                mode === 'Lockout'
                    ? ' no longer has lockout.'
                    : mode === 'Blackout'
                      ? ' no longer has blackout.'
                      : ' has no longer completed the goal.',
            ];
        case 'timer:started':
            return ['The timer has started.'];
        case 'timer:reset':
            return ['The timer has been reset.'];
        case 'timer:stopped':
            return ['The timer has stopped.'];
        default:
            return undefined;
    }
}

function formatEvent(
    event: ServerMessage,
    startedAt?: DateTime,
    mode?: string,
): ChatMessage {
    const contents = eventMessage(event, mode);
    if (!event.timestamp || event.action === 'chatSent') return contents ?? [];
    if (!contents) return [];
    const elapsed = startedAt
        ? DateTime.fromISO(event.timestamp).diff(startedAt).toMillis()
        : 0;
    const timestamp = Duration.fromMillis(Math.max(0, elapsed)).toFormat(
        'h:mm:ss',
    );
    return [`[${timestamp}] `, ...contents];
}

export default function RoomChat() {
    const { history, sendChatMessage, roomData } = useContext(RoomContext);
    const messages = useMemo(
        () =>
            history.reduce<{
                startedAt?: DateTime;
                mode?: string;
                messages: ChatMessage[];
            }>(
                (previous, event) => {
                    const startedAt =
                        event.action === 'connected' ||
                        event.action === 'updateRoomData'
                            ? event.roomData?.startedAt
                                ? DateTime.fromISO(event.roomData.startedAt)
                                : undefined
                            : event.action === 'timer:started'
                              ? event.timestamp
                                  ? DateTime.fromISO(event.timestamp)
                                  : undefined
                              : event.action === 'timer:reset'
                                ? undefined
                                : previous.startedAt;
                    const mode =
                        event.action === 'connected' ||
                        event.action === 'updateRoomData'
                            ? (event.roomData?.mode ?? previous.mode)
                            : previous.mode;
                    return {
                        startedAt,
                        mode,
                        messages: [
                            ...previous.messages,
                            formatEvent(
                                event,
                                event.action === 'timer:reset'
                                    ? previous.startedAt
                                    : startedAt,
                                mode,
                            ),
                        ],
                    };
                },
                {
                    messages: [],
                },
            ).messages,
        [history],
    );

    const [message, setMessage] = useState('');

    const chatDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatDivRef.current?.scrollTo(0, chatDivRef.current.scrollHeight);
    }, [messages]);

    return (
        <Paper
            sx={{
                display: 'flex',
                height: '100%',
                flexDirection: 'column',
                rowGap: 1,
                p: 1,
            }}
        >
            {roomData?.chatEnabled ? (
                <>
                    <Box
                        sx={{
                            height: '100%',
                            flexGrow: 1,
                            overflowY: 'auto',
                            px: 1,
                        }}
                        ref={chatDivRef}
                    >
                        {messages.map((message, index) => (
                            <div key={index}>
                                {message.map(
                                    (messageContents, contentIndex) => {
                                        if (
                                            typeof messageContents === 'string'
                                        ) {
                                            return (
                                                <span
                                                    key={`${contentIndex}`}
                                                    style={{}}
                                                >
                                                    {messageContents}
                                                </span>
                                            );
                                        }
                                        return (
                                            <span
                                                key={`${contentIndex}`}
                                                style={{
                                                    color: messageContents.color,
                                                }}
                                            >
                                                {messageContents.contents}
                                            </span>
                                        );
                                    },
                                )}
                            </div>
                        ))}
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            columnGap: 1,
                        }}
                    >
                        <TextField
                            size="small"
                            variant="outlined"
                            value={message}
                            placeholder="Send a chat message..."
                            onChange={(event) => setMessage(event.target.value)}
                            onKeyUp={(event) => {
                                if (event.key === 'Enter') {
                                    sendChatMessage(message);
                                    setMessage('');
                                }
                            }}
                            sx={{ flexGrow: 1 }}
                        />
                        <Button
                            variant="contained"
                            endIcon={<SendIcon />}
                            onClick={() => {
                                sendChatMessage(message);
                                setMessage('');
                            }}
                        >
                            Send
                        </Button>
                    </Box>
                </>
            ) : (
                <Typography variant="h6" align="center">
                    Chat is disabled for this room
                </Typography>
            )}
        </Paper>
    );
}
