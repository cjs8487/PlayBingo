'use client';
import { RoomContext } from '@/context/RoomContext';
import SendIcon from '@mui/icons-material/Send';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import {
    AnnouncementPlayer,
    ChatMessage,
    ServerMessage,
} from '@playbingo/types';
import { DateTime, Duration } from 'luxon';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';

function playerName(player: AnnouncementPlayer, qualifyTeam = false) {
    return {
        contents:
            qualifyTeam && player.teamsEnabled && player.team
                ? `${player.nickname} (${player.team.name})`
                : player.nickname,
        color: player.team?.color,
    };
}

function eventMessage(event: ServerMessage): ChatMessage | undefined {
    switch (event.action) {
        case 'chatSent':
        case 'system:message':
            return event.message;
        case 'players:join':
            return event.player.team
                ? [
                      {
                          contents: event.player.nickname,
                          color: event.player.team.color,
                      },
                      event.player.teamsEnabled
                          ? ` has joined playing for ${event.player.team.name}.`
                          : ' has joined.',
                  ]
                : [`${event.player.nickname} is now spectating`];
        case 'players:leave':
        case 'board:revealed': {
            const message =
                event.action === 'players:leave'
                    ? ' has left.'
                    : ' has revealed the card.';
            return event.player.team
                ? [
                      {
                          contents: event.player.nickname,
                          color: event.player.team.color,
                      },
                      message,
                  ]
                : [`${event.player.nickname}${message}`];
        }
        case 'player:colorChanged':
            return [
                {
                    contents: playerName(event.player, true).contents,
                    color: event.newColor,
                },
                ' has changed their color to ',
                { contents: event.newColor, color: event.newColor },
            ];
        case 'board:goalMarked':
        case 'board:goalUnmarked': {
            const { contents, color } = playerName(event.player, true);
            return [
                color ? { contents, color } : contents,
                ` ${event.action === 'board:goalMarked' ? 'marked' : 'unmarked'} ${event.goal ?? 'a hidden goal'} (${event.row},${event.col})`,
            ];
        }
        case 'board:regenerated':
            return ['The card has been regenerated.'];
        case 'team:finished':
            return [
                { contents: event.teamDisplayName, color: event.team.color },
                event.mode === 'LOCKOUT'
                    ? ' has achieved lockout!'
                    : event.mode === 'BLACKOUT'
                      ? ' has achieved blackout!'
                      : ' has completed the goal!',
            ];
        case 'team:unfinished':
            return [
                { contents: event.teamDisplayName, color: event.team.color },
                event.mode === 'LOCKOUT'
                    ? ' no longer has lockout.'
                    : event.mode === 'BLACKOUT'
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

function formatEvent(event: ServerMessage): ChatMessage | undefined {
    const contents = eventMessage(event);
    if (
        !contents ||
        !event.timestamp ||
        event.action === 'chatSent' ||
        event.action === 'system:message'
    ) {
        return contents;
    }
    const elapsed =
        'startedAt' in event && typeof event.startedAt === 'string'
            ? DateTime.fromISO(event.timestamp)
                  .diff(DateTime.fromISO(event.startedAt))
                  .toMillis()
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
            history.flatMap((event) => {
                const message = formatEvent(event);
                return message ? [message] : [];
            }),
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
