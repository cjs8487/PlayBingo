import { Card, CardContent, Box, Typography, Button } from '@mui/material';
import { ConnectionStatus, useRoomContext } from '../../context/RoomContext';
import ColorSelect from './ColorSelect';
import { Sword } from 'mdi-material-ui';

export default function PlayerInfo() {
    const { connectionStatus, nickname, disconnect, monitor, spectator } =
        useRoomContext();
    return (
        <Card>
            <CardContent>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1,
                        columnGap: 1,
                    }}
                >
                    <Typography variant="h6">
                        {spectator ? 'Spectating' : 'Playing'} as {nickname}
                    </Typography>
                    {monitor && <Sword sx={{ color: 'green' }} />}
                    <Box sx={{ flexGrow: 1 }} />
                    {connectionStatus !== ConnectionStatus.CLOSED && (
                        <Button onClick={disconnect}>Disconnect</Button>
                    )}
                </Box>
                <Box>
                    <Typography>Choose your color</Typography>
                    <ColorSelect />
                </Box>
            </CardContent>
        </Card>
    );
}
