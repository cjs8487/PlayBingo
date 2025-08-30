import {
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Switch,
} from '@mui/material';
import { useGoalManagerContext } from '../../context/GoalManagerContext';

export const SettingsDialogContent: React.FC = () => {
    const { settings, setSettings } = useGoalManagerContext();

    return (
        <>
            <DialogTitle>Goal Manager Settings</DialogTitle>
            <DialogContent>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.showDetails}
                            onChange={(e) =>
                                setSettings(() => ({
                                    ...settings,
                                    showDetails: e.target.checked,
                                }))
                            }
                        />
                    }
                    label="Display additional information in goal list"
                />
            </DialogContent>
        </>
    );
};
