import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Typography,
} from '@mui/material';
import { useCallback, useContext, useState } from 'react';
import { RoomContext } from '../../context/RoomContext';
import ConnectionState from './ConnectionState';
import RoomControlDialog from './RoomControlDialog';

export default function RoomInfo() {
    const { roomData } = useContext(RoomContext);

    const [showControlModal, setShowControlModal] = useState(false);

    const close = useCallback(() => {
        setShowControlModal(false);
    }, []);

    if (!roomData) {
        return (
            <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                    No Room Data found.
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardActionArea
                    onClick={() => {
                        setShowControlModal(true);
                    }}
                >
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h5">{roomData.name}</Typography>
                        <Typography>{roomData.game}</Typography>
                        <Typography component="div" variant="caption">
                            {roomData.slug}
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 1,
                                mt: 1,
                                mb: 2,
                            }}
                        >
                            <Typography>{roomData.variant}</Typography>
                            <Box sx={{ borderLeft: 1 }} />
                            <Typography>{roomData.mode}</Typography>
                        </Box>
                        <ConnectionState />
                    </CardContent>
                </CardActionArea>
            </Card>
            <RoomControlDialog show={showControlModal} close={close} />
        </>
    );
}
