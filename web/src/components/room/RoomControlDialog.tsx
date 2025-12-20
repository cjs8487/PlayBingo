import { Timer } from '@mui/icons-material';
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
    InputLabel,
    MenuItem,
    Select,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { Game } from '@playbingo/types';
import { Form, Formik } from 'formik';
import Image from 'next/image';
import { useContext } from 'react';
import { useAsync } from 'react-use';
import { RoomContext } from '../../context/RoomContext';
import FormikTextField from '../input/FormikTextField';
import rtLogo from '/public/rtgg128.png';

interface RoomControlDialogProps {
    show: boolean;
    close: () => void;
}

export default function RoomControlDialog({
    show,
    close,
}: RoomControlDialogProps) {
    const { roomData, regenerateCard, changeRaceHandler, connectedPlayer } =
        useContext(RoomContext);

    const handleRaceHandlerChange = (
        event: React.MouseEvent<HTMLElement>,
        handler: string | null,
    ) => {
        changeRaceHandler(handler ?? '');
    };

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

    if (modes.loading || modes.error || !modes.value) {
        return null;
    }

    return (
        <Dialog onClose={close} open={show}>
            <DialogTitle variant="h5">Room Controls</DialogTitle>
            <DialogContent>
                {connectedPlayer?.monitor && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6">Monitor Actions</Typography>
                        <Typography sx={{ mb: 0.5 }}>Timing Method</Typography>
                        <ToggleButtonGroup
                            value={roomData?.raceHandler}
                            exclusive
                            onChange={handleRaceHandlerChange}
                            aria-label="race handler"
                            size="small"
                        >
                            <ToggleButton
                                value="LOCAL"
                                aria-label="left aligned"
                            >
                                <Timer />
                                <Typography
                                    sx={{ ml: 1, textTransform: 'none' }}
                                >
                                    Basic Timer
                                </Typography>
                            </ToggleButton>
                            <ToggleButton
                                value="RACETIME"
                                aria-label="centered"
                            >
                                <Image
                                    src={rtLogo}
                                    width={32}
                                    height={32}
                                    alt=""
                                />
                                <Typography
                                    sx={{ ml: 1, textTransform: 'none' }}
                                >
                                    racetime.gg
                                </Typography>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                )}
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
            </DialogContent>
        </Dialog>
    );
}
