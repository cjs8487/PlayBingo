'use client';
import { RoomContext } from '@/context/RoomContext';
import { Button, Input, TextField } from '@heroui/react';
import SendIcon from '@mui/icons-material/Send';
import { useContext, useEffect, useRef, useState } from 'react';

export default function RoomChat() {
    const { messages, sendChatMessage } = useContext(RoomContext);

    const [message, setMessage] = useState('');

    const chatDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatDivRef.current?.scrollTo(0, chatDivRef.current.scrollHeight);
    }, [messages]);

    return (
        <div className="bg-surface-secondary grid-rows-[1fr_auto absolute grid h-full w-full grid-cols-1 gap-2 p-2">
            <div className="max-h-full overflow-y-auto px-2" ref={chatDivRef}>
                {messages.map((message, index) => (
                    <div key={index}>
                        {message.map((messageContents, contentIndex) => {
                            if (typeof messageContents === 'string') {
                                return (
                                    <span key={`${contentIndex}`} style={{}}>
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
                        })}
                    </div>
                ))}
            </div>
            <div className="flex gap-1">
                <TextField
                    value={message}
                    className="grow"
                    fullWidth
                    onChange={setMessage}
                    onKeyUp={(event) => {
                        if (event.key === 'Enter') {
                            sendChatMessage(message);
                            setMessage('');
                        }
                    }}
                >
                    <Input placeholder="Send a chat message..." />
                </TextField>
                <Button
                    onClick={() => {
                        sendChatMessage(message);
                        setMessage('');
                    }}
                >
                    Send
                    <SendIcon />
                </Button>
            </div>
        </div>
    );
}
