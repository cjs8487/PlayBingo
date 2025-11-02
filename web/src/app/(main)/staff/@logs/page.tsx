import { Typography } from '@mui/material';
import { serverGet } from '../../../ServerUtils';
import LogTable from './_components/LogTable';

type BasicLogEntry = {
    level: string;
    message: string;
    timestamp: string;
};

type RequestLogEntry = BasicLogEntry & {
    method: string;
    path: string;
    statusCode: number;
    sessionId: string;
    userAgent: string;
    ip: string;
    durationMs: number;
};

type RoomLogEntry = (BasicLogEntry | RequestLogEntry) & {
    room: string;
};

export type LogEntry = BasicLogEntry | RequestLogEntry | RoomLogEntry;

async function getLogs(): Promise<LogEntry[]> {
    const res = await serverGet('/api/logs');
    if (!res.ok) {
        return [];
    }
    return res.json();
}

export default async function Logs() {
    const logs = await getLogs();

    if (!logs) {
        return <Typography>Failed to load logs</Typography>;
    }

    return <LogTable logs={logs} />;
}
