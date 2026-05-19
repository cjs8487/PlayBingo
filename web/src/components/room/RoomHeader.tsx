import { Box, Typography } from '@mui/material';
import ConnectionState from './ConnectionState';
import { useRoomContext } from '../../context/RoomContext';
import Timer from './timer/Timer';

export default function RoomHeader() {
    const { roomData } = useRoomContext();

    if (!roomData) {
        return null;
    }

    return (
        <Box
            sx={{
                position: 'relative',
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 3,
                py: 1,
                borderTop: 1,
                borderColor: 'divider',
            }}
        >
            <Box sx={{ flexGrow: 1 }} className="grow">
                <Typography variant="h5" className="mb-0.5 text-lg">
                    {roomData.name}
                </Typography>
                <Typography variant="subtitle1" className="mb-1.5 flex text-xs">
                    <div>
                        {roomData.game} ({roomData.variant})
                    </div>
                </Typography>
                <Box
                    sx={{ display: 'flex', alignItems: 'center' }}
                    className="flex text-xs"
                >
                    <Typography
                        variant="body2"
                        sx={{
                            borderRight: 1,
                            borderColor: 'divider',
                            pr: 1,
                            mr: 1,
                        }}
                    >
                        {roomData.slug}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            borderRight: 1,
                            borderColor: 'divider',
                            pr: 1,
                            mr: 1,
                        }}
                    >
                        {roomData.mode}
                    </Typography>
                    <Typography variant="body2">{roomData.seed}</Typography>
                </Box>
            </Box>
            <Box
                sx={{
                    position: 'absolute',
                    textAlign: 'center',
                }}
            >
                <Timer />
            </Box>
            <div>
                <ConnectionState />
            </div>
        </Box>
    );
}
