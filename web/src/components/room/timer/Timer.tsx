import { RoomContext } from '@/context/RoomContext';
import { Button, Card, CardContent } from '@mui/material';
import { Duration } from 'luxon';
import { useContext } from 'react';
import RacetimeCard from '../racetime/RacetimeCard';
import TimerDisplay from './TimerDisplay';

export default function Timer() {
    const { roomData, startTimer } = useContext(RoomContext);

    if (!roomData) {
        return null;
    }

    const { racetimeConnection } = roomData;

    if (racetimeConnection) {
        return <RacetimeCard />;
    }

    const offset = Duration.fromDurationLike(0);

    return (
        <Card>
            <CardContent>
                <TimerDisplay offset={offset} />
                <Button onClick={startTimer}>Start</Button>
            </CardContent>
        </Card>
    );
}
