import {
    Typography,
    FormControlLabel,
    Button,
    Box,
    Switch,
    Divider,
} from '@mui/material';
import ColorSelect from './ColorSelect';
import { Refresh, Sword } from 'mdi-material-ui';
import TeamControls from './TeamControls';
import { ConnectionStatus, useRoomContext } from '../../context/RoomContext';

export default function SettingsPanel() {
    const {
        showCounters,
        toggleCounters,
        showGoalDetails,
        toggleGoalDetails,
        showImages,
        toggleImages,
        notificationSoundEnabled,
        toggleNotificationSound,
        connectionStatus,
        connectedTeam,
        changeAuth,
        disconnect,
        connectedPlayer,
        roomData,
        setChatEnabled,
        setTeamsEnabled,
        regenerateCard,
    } = useRoomContext();

    const connected = connectionStatus === ConnectionStatus.CONNECTED;

    return (
        <>
            {connected && connectedPlayer && (
                <>
                    <Typography
                        variant="subtitle1"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                        {connectedTeam ? 'Playing' : 'Spectating'} as{' '}
                        {connectedPlayer.nickname}
                        {connectedPlayer.monitor && (
                            <Sword
                                titleAccess="Room monitor"
                                fontSize="small"
                                color="success"
                            />
                        )}
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            mt: 1,
                        }}
                    >
                        <Button
                            size="small"
                            onClick={() => changeAuth(Boolean(connectedTeam))}
                        >
                            {connectedTeam ? 'Spectate' : 'Join Game'}
                        </Button>
                        <Button
                            size="small"
                            color="secondary"
                            onClick={disconnect}
                        >
                            Disconnect
                        </Button>
                    </Box>
                    {connectedTeam && (
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 1,
                                mt: 1,
                            }}
                        >
                            <ColorSelect />
                            <TeamControls />
                        </Box>
                    )}
                    <Divider sx={{ my: 2 }} />
                </>
            )}
            <Box>
                <Typography variant="h6">Settings</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showCounters}
                            onChange={(e) => {
                                if (e.target.checked !== showCounters) {
                                    toggleCounters();
                                }
                            }}
                        />
                    }
                    label="Show Counters"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={showGoalDetails}
                            onChange={(e) => {
                                if (e.target.checked !== showGoalDetails) {
                                    toggleGoalDetails();
                                }
                            }}
                        />
                    }
                    label="Show All Goal Details"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={showImages}
                            onChange={(e) => {
                                if (e.target.checked !== showImages) {
                                    toggleImages();
                                }
                            }}
                        />
                    }
                    label="Show Images"
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={notificationSoundEnabled}
                            onChange={toggleNotificationSound}
                        />
                    }
                    label="Notification Sound"
                />
                {connected && connectedPlayer?.monitor && (
                    <>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={roomData?.chatEnabled ?? true}
                                    onChange={(event) =>
                                        setChatEnabled(event.target.checked)
                                    }
                                />
                            }
                            label="Enable chat"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={roomData?.teamsEnabled ?? false}
                                    onChange={(event) =>
                                        setTeamsEnabled(event.target.checked)
                                    }
                                />
                            }
                            label="Enable teams"
                        />
                        <Button
                            size="small"
                            onClick={() => regenerateCard()}
                            sx={{ width: '100%', mt: 1 }}
                            startIcon={<Refresh />}
                        >
                            Regenerate Card
                        </Button>
                    </>
                )}
            </Box>
        </>
    );
}
