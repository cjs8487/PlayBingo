import {
    Box,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    MenuItem,
    Select,
    Switch,
    Typography,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { useGoalManagerContext } from '../../context/GoalManagerContext';
import HoverIcon from '@/components/HoverIcon';

export const SettingsDialogContent: React.FC = () => {
    const {
        settings,
        setSettings,
        language,
        setLanguage,
        allLanguages,
        defaultLanguage,
    } = useGoalManagerContext();
    useGoalManagerContext();

    return (
        <>
            <DialogTitle>Goal Manager Settings</DialogTitle>
            <DialogContent>
                <FormControl
                    component="fieldset"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        width: '100%',
                        mt: 1,
                    }}
                >
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.showDetails}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        showDetails: e.target.checked,
                                    })
                                }
                            />
                        }
                        label="Display additional information in goal list"
                    />

                    {/* Horizontal layout: label + select + tooltip */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                        }}
                    >
                        <Typography variant="body1" sx={{ minWidth: 100 }}>
                            Language
                        </Typography>
                        <Select
                            id="language-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                        >
                            <MenuItem key="default" value={defaultLanguage}>
                                {defaultLanguage} - (DEFAULT)
                            </MenuItem>
                            {allLanguages?.map((lang) => (
                                <MenuItem key={lang} value={lang}>
                                    {lang}
                                </MenuItem>
                            ))}
                        </Select>
                        <HoverIcon icon={<Info />}>
                            Choose which language to edit for goals
                        </HoverIcon>
                    </Box>
                </FormControl>
            </DialogContent>
        </>
    );
};
