import {
    Typography,
    FormControlLabel,
    Button,
    Box,
    Switch,
} from '@mui/material';
import ColorSelect from './ColorSelect';
import { Refresh } from 'mdi-material-ui';
import { useRoomContext } from '../../context/RoomContext';

export default function SettingsPanel() {
    const {
        roomData,
        showCounters,
        toggleCounters,
        showGoalDetails,
        toggleGoalDetails,
        regenerateCard,
        connectedPlayer,
        setChatEnabled,
    } = useRoomContext();

    return (
        <>
            <ColorSelect />
            <Box sx={{ my: 2, border: 1, borderColor: 'divider' }} />
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
                {connectedPlayer?.monitor && (
                    <>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={roomData?.chatEnabled ?? true}
                                    onChange={(e) =>
                                        setChatEnabled(e.target.checked)
                                    }
                                />
                            }
                            label="Enable chat"
                        />
                        <Button
                            size="small"
                            onClick={() => regenerateCard()}
                            sx={{ width: '100%' }}
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
