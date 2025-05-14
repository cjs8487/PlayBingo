import {
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Switch,
} from '@mui/material';
import { useGoalManagerContext } from '../../context/GoalManagerContext';

interface SettingsDialogContentProps {}

export const SettingsDialogContent: React.FC<
    SettingsDialogContentProps
> = ({}) => {
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
                                setSettings((curr) => ({
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
