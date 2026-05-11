import { RoomContext } from '@/context/RoomContext';
import { Check, FastRewind, PlayArrow } from '@mui/icons-material';
import { Button, ButtonGroup } from '@mui/material';
import { useContext } from 'react';

export default function TimerControls() {
    const { roomData, startTimer, resetTimer, connectedPlayer } =
        useContext(RoomContext);

    if (!roomData) {
        return null;
    }

    const { racetimeConnection } = roomData;

    if (racetimeConnection) {
        return null;
    }

    const started = !!roomData.startedAt;

    return (
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
    );
}
