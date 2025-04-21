import { Card, CardContent, Box, Typography, Button } from '@mui/material';
import { ConnectionStatus, useRoomContext } from '../../context/RoomContext';
import ColorSelect from './ColorSelect';

export default function PlayerInfo() {
    const { connectionStatus, nickname, disconnect } = useRoomContext();
    return (
        <Card>
            <CardContent>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexGrow: 1
                    }}>
                    <Typography variant="h6" sx={{
                        flexGrow: 1
                    }}>
                        Playing as {nickname}
                    </Typography>
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
