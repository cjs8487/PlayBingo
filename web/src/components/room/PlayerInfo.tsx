import {
    Card,
    CardContent,
    Box,
    Typography,
    Button,
    FormControlLabel,
    Switch,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import { ConnectionStatus, useRoomContext } from '../../context/RoomContext';
import ColorSelect from './ColorSelect';
import { Sword } from 'mdi-material-ui';
import { useId } from 'react';

export default function PlayerInfo() {
    const teamSelectId = useId();
    const {
        connectionStatus,
        nickname,
        disconnect,
        showGoalDetails,
        toggleGoalDetails,
        showCounters,
        toggleCounters,
        connectedPlayer,
        changeAuth,
        showImages,
        toggleImages,
        roomData,
        teams,
        connectedTeam,
        joinTeam,
    } = useRoomContext();

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
                        {!connectedPlayer?.teamId ? 'Spectating' : 'Playing'} as{' '}
                        {connectedPlayer?.nickname ?? nickname}
                    </Typography>
                    {connectedPlayer?.monitor && (
                        <Sword sx={{ color: 'green' }} />
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    {connectionStatus !== ConnectionStatus.CLOSED && (
                        <>
                            {!connectedPlayer?.teamId ? (
                                <Button onClick={() => changeAuth(false)}>
                                    Join Game
                                </Button>
                            ) : (
                                <Button onClick={() => changeAuth(true)}>
                                    Spectate
                                </Button>
                            )}
                            <Button onClick={disconnect}>Disconnect</Button>
                        </>
                    )}
                </Box>
                {roomData?.teamsEnabled && connectedTeam && (
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                        <InputLabel id={`${teamSelectId}-label`}>
                            Team
                        </InputLabel>
                        <Select
                            labelId={`${teamSelectId}-label`}
                            id={teamSelectId}
                            label="Team"
                            value={connectedTeam?.id ?? ''}
                            onChange={(event) => joinTeam(event.target.value)}
                            disabled={
                                connectionStatus !== ConnectionStatus.CONNECTED
                            }
                        >
                            {teams.map((team) => (
                                <MenuItem key={team.id} value={team.id}>
                                    {team.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                {connectedTeam && (
                    <Box>
                        <Typography>
                            {roomData?.teamsEnabled
                                ? 'Choose your team color'
                                : 'Choose your color'}
                        </Typography>
                        <ColorSelect />
                    </Box>
                )}
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
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showImages}
                                onChange={toggleImages}
                            />
                        }
                        label="Show Images"
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
