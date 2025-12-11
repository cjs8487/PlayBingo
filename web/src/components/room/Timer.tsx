import { Button, Card, CardContent, Typography } from '@mui/material';
import { DateTime, Duration } from 'luxon';
import { useContext, useEffect, useState } from 'react';
import { useInterval } from 'react-use';
import { RoomContext } from '@/context/RoomContext';

export default function Timer() {
    const { roomData, startTimer } = useContext(RoomContext);

    if (!roomData) {
        return null;
    }

    const { startedAt, finishedAt } = roomData;

    let startDt: DateTime | undefined;
    if (startedAt) {
        startDt = DateTime.fromISO(startedAt);
    }
    let endDt: DateTime | undefined;
    if (finishedAt) {
        endDt = DateTime.fromISO(finishedAt);
    }
    const offset = Duration.fromDurationLike(0);

    return (
        <Card>
            <CardContent>
                <TimerDisplay start={startDt} end={endDt} offset={offset} />
                <Button onClick={startTimer}>Start</Button>
            </CardContent>
        </Card>
    );
}

function TimerDisplay({
    start,
    offset,
    end,
}: {
    start?: DateTime;
    end?: DateTime;
    offset: Duration;
}) {
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
        <Typography variant="h6">
            {dur.toFormat('h:mm:ss')}.{dur.milliseconds % 10}
        </Typography>
    );
}
