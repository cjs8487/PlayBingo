import {
    Card,
    CardContent,
    Box,
    Typography,
    Button,
    FormControlLabel,
    Switch,
} from '@mui/material';
import { ConnectionStatus, useRoomContext } from '../../context/RoomContext';
import ColorSelect from './ColorSelect';

export default function PlayerInfo() {
    const {
        connectionStatus,
        nickname,
        disconnect,
        showGoalDetails,
        toggleGoalDetails,
        showCounters,
        toggleCounters,
    } = useRoomContext();
    return (
        <Card>
            <CardContent>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexGrow: 1,
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            flexGrow: 1,
                        }}
                    >
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
                <Box sx={{ mt: 1.5 }}>
                    <Typography variant="h6">Settings</Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showCounters}
                                onChange={toggleCounters}
                            />
                        }
                        label="Show Counters"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showGoalDetails}
                                onChange={toggleGoalDetails}
                            />
                        }
                        label="Show All Goal Details"
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
