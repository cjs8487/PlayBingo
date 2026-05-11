import { Timer } from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import Image from 'next/image';
import { useContext } from 'react';
import { RoomContext } from '@/context/RoomContext';

export default function TimingMethodSelector() {
    const { roomData, changeRaceHandler, connectedPlayer } =
        useContext(RoomContext);

    const handleRaceHandlerChange = (
        event: React.MouseEvent<HTMLElement>,
        handler: string | null,
    ) => {
        changeRaceHandler(handler ?? '');
    };

    if (!connectedPlayer?.monitor) {
        return null;
    }

    return (
        <ToggleButtonGroup
            value={roomData?.raceHandler}
            exclusive
            onChange={handleRaceHandlerChange}
            aria-label="race handler"
            size="small"
            orientation="horizontal"
            fullWidth
        >
            <ToggleButton value="LOCAL" aria-label="basic timer">
                <Timer fontSize="small" />
                <Typography sx={{ ml: 1, textTransform: 'none' }}>
                    Basic Timer
                </Typography>
            </ToggleButton>
            <ToggleButton value="RACETIME" aria-label="racetime.gg">
                <Image src="/rtgg128.png" width={24} height={24} alt="" />
                <Typography sx={{ ml: 1, textTransform: 'none' }}>
                    racetime.gg
                </Typography>
            </ToggleButton>
        </ToggleButtonGroup>
    );
}
