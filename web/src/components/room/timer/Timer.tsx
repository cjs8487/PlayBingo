import { RoomContext } from '@/context/RoomContext';
import { Check, FastRewind, PlayArrow } from '@mui/icons-material';
import { Button, ButtonGroup, Card, CardContent } from '@mui/material';
import { Duration } from 'luxon';
import { useContext } from 'react';
import RacetimeCard from '../racetime/RacetimeCard';
import TimerDisplay from './TimerDisplay';

export default function Timer() {
    const { roomData, startTimer, resetTimer, connectedPlayer } =
        useContext(RoomContext);

    if (!roomData) {
        return null;
    }

    const { racetimeConnection } = roomData;

    if (racetimeConnection) {
        return <RacetimeCard />;
    }

    const offset = Duration.fromDurationLike(0);

    const started = !!roomData.startedAt;

    return (
        <Card>
            <CardContent>
                <TimerDisplay offset={offset} />
                <ButtonGroup
                    size="small"
                    variant="contained"
                    color="inherit"
                    sx={{ mt: 0.5 }}
                >
                    <Button
                        disabled={!started || !connectedPlayer?.monitor}
                        onClick={resetTimer}
                    >
                        <FastRewind />
                    </Button>
                    {started ? (
                        <Button disabled={!started}>
                            <Check />
                        </Button>
                    ) : (
                        <Button onClick={startTimer}>
                            <PlayArrow />
                        </Button>
                    )}
                </ButtonGroup>
            </CardContent>
        </Card>
    );
}
