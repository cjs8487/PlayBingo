import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    Typography,
} from '@mui/material';
import { Field, Form, Formik } from 'formik';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { useAsync, useCopyToClipboard } from 'react-use';
import { RoomContext } from '../../context/RoomContext';
import { Game } from '@playbingo/types';
import FormikTextField from '../input/FormikTextField';

interface RoomControlDialogProps {
    show: boolean;
    close: () => void;
}

export default function RoomControlDialog({
    show,
    close,
}: RoomControlDialogProps) {
    const {
        roomData,
        regenerateCard,
        board,
        showGoalDetails,
        toggleGoalDetails,
        showCounters,
        toggleCounters,
    } = useContext(RoomContext);

    const modes = useAsync(async () => {
        if (!roomData) {
            return [];
        }

        const res = await fetch(`/api/games/${roomData.gameSlug}`);
        if (!res.ok) {
            return [];
        }
        const gameData: Game = await res.json();

        const modes = ['Random'];
        if (gameData.enableSRLv5) {
            modes.push('SRLv5');
        }
        return modes;
    }, [roomData]);

    const [, copyToClipboard] = useCopyToClipboard();

    if (modes.loading || modes.error || !modes.value) {
        return null;
    }

    return (
        <Dialog onClose={close} open={show}>
            <DialogTitle variant="h5">Room Controls</DialogTitle>
            <DialogContent>
                <Typography variant="h6">Card Controls</Typography>

                <Formik
                    initialValues={{
                        seed: undefined,
                        generationMode: '',
                    }}
                    onSubmit={({ seed, generationMode }) => {
                        regenerateCard({
                            seed,
                            generationMode,
                        });
                        close();
                    }}
                >
                    {({ handleChange, handleBlur, values }) => (
                        <Form>
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                >
                                    Advanced Generation Options
                                </AccordionSummary>
                                <AccordionDetails
                                    sx={{ display: 'flex', columnGap: 2 }}
                                >
                                    <Box
                                        sx={{
                                            width: '50%',
                                        }}
                                    >
                                        <FormikTextField
                                            type="number"
                                            name="seed"
                                            label="Seed"
                                            pattern="[0-9]*"
                                            inputMode="numeric"
                                            fullWidth
                                            size="small"
                                        />
                                    </Box>
                                    <Box
                                        sx={{
                                            width: '50%',
                                        }}
                                    >
                                        <FormControl fullWidth>
                                            <InputLabel
                                                size="small"
                                                id="generationMode-label"
                                            >
                                                Generation Mode
                                            </InputLabel>
                                            <Select
                                                id="generationMode"
                                                labelId="generationMode-label"
                                                name="generationMode"
                                                value={values.generationMode}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                fullWidth
                                                size="small"
                                            >
                                                {modes.value.map((mode) => (
                                                    <MenuItem
                                                        key={mode}
                                                        value={mode}
                                                    >
                                                        {mode}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                            <Button type="submit">Regenerate Card</Button>
                        </Form>
                    )}
                </Formik>
                <Box
                    sx={{
                        pt: 2,
                    }}
                >
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
                    <Typography variant="h6">Local Actions</Typography>
                    <Typography variant="caption">
                        These actions are potentially destructive and should
                        only be used if the application is exhibiting strange or
                        incorrect behavior
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                        }}
                    >
                        <Button
                            onClick={() => {
                                window.dispatchEvent(new Event('resize'));
                            }}
                        >
                            Fit Goal Text
                        </Button>
                    </Box>
                </Box>
                {!board.hidden && (
                    <Box
                        sx={{
                            pt: 2,
                        }}
                    >
                        <Button
                            onClick={() => {
                                const data = board.board
                                    .map((row) =>
                                        row.map((cell) => ({
                                            name: cell.goal,
                                        })),
                                    )
                                    .flat();
                                copyToClipboard(JSON.stringify(data));
                                toast(
                                    'Copied bingosync goal list for this board to your clipboard',
                                );
                            }}
                        >
                            Export to Bingosync
                        </Button>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
