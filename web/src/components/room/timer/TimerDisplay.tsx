import { Typography } from '@mui/material';
import { DateTime, Duration } from 'luxon';
import { useEffect, useState } from 'react';
import { useInterval } from 'react-use';
import { useRoomContext } from '../../../context/RoomContext';

export default function TimerDisplay({ offset }: { offset: Duration }) {
    const { roomData } = useRoomContext();

    const { startedAt, finishedAt } = roomData!;

    let start: DateTime | undefined;
    if (startedAt) {
        start = DateTime.fromISO(startedAt);
    }
    let end: DateTime | undefined;
    if (finishedAt) {
        end = DateTime.fromISO(finishedAt);
    }

    const [updateTimer, setUpdateTimer] = useState(true);
    const [dur, setDur] = useState<Duration>(
        start && end ? end.diff(start) : offset,
    );

    let interval;
    if (updateTimer) {
        if (end) {
            interval = null;
        } else if (start) {
            interval = 10;
        } else {
            interval = 1000;
        }
    } else {
        interval = null;
    }

    useInterval(() => {
        if (end && start) {
            setDur(end.diff(start));
        } else if (start) {
            setDur(DateTime.now().diff(start).normalize());
        } else {
            setDur(offset);
        }
    }, interval);

    useEffect(() => {
        const callback = () => {
            if (document.hidden) {
                setUpdateTimer(false);
            } else {
                setUpdateTimer(true);
            }
        };
        document.addEventListener('visibilitychange', callback);
        return () => document.removeEventListener('visibilitychange', callback);
    }, []);

    return (
        <Typography sx={{ fontFamily: 'monospace', fontSize: 28 }}>
            {dur.shiftToAll().toFormat('h:mm:ss')}.
            {Math.floor((dur.milliseconds % 1000) / 100)}
        </Typography>
    );
}
