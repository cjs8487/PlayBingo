'use client';
import { alertError } from '@/lib/Utils';
import { Game } from '@playbingo/types';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import {
    ErrorMessage,
    Field,
    Form,
    Formik,
    useField,
    useFormikContext,
} from 'formik';
import { useRouter } from 'next/navigation';
import { useAsync } from 'react-use';
import * as yup from 'yup';
import { useApi } from '../lib/Hooks';
import {
    FormikSelectField,
    FormikSelectFieldAutocomplete,
} from './input/FormikSelectField';
import FormikTextField from './input/FormikTextField';
import FormikSwitch from './input/FormikSwitch';
import NumberInput from './input/NumberInput';

const roomValidationSchema = yup.object().shape({
    name: yup.string().required('Room name is required'),
    nickname: yup.string().required('Player nickname is required'),
    password: yup.string().required('Password is required'),
    game: yup.string().required('Game is required'),
    // variant: yup.string().required('Game variant is required'),
    mode: yup
        .string()
        .required('Game mode is required')
        .oneOf(['LINES', 'BLACKOUT', 'LOCKOUT'], 'Invalid game mode'),
});

function GenerationModeSelectField() {
    const {
        values: { game },
    } = useFormikContext<{ game: string }>();
    const [field] = useField<string>('generationMode');

    const modes = useAsync(async () => {
        if (!game) {
            return [];
        }

        const res = await fetch(`/api/games/${game}`);
        if (!res.ok) {
            return [];
        }
        const gameData: Game = await res.json();

        const modes = ['Random'];
        if (gameData.enableSRLv5) {
            modes.push('SRLv5');
        }
        if (gameData.difficultyVariantsEnabled) {
            modes.push('Difficulty');
        }
        return modes;
    }, [game]);

    if (modes.loading || modes.error || !modes.value) {
        return null;
    }

    return (
        <FormControl>
            <InputLabel id="generationMode-label">Generation Mode</InputLabel>
            <Select
                id="generationMode"
                labelId="generationMode-label"
                name="generationMode"
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                fullWidth
            >
                {modes.value.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                        {mode}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

function DifficultySelectField() {
    const {
        values: { game, generationMode },
    } = useFormikContext<{ game: string; generationMode: string }>();
    const [field] = useField<string>('difficulty');

    const difficulties = useAsync(async () => {
        if (!game) {
            return [];
        }

        const res = await fetch(`/api/games/${game}`);
        if (!res.ok) {
            return [];
        }
        const gameData: Game = await res.json();
        return gameData.difficultyVariantsEnabled
            ? (gameData.difficultyVariants ?? [])
            : [];
    }, [game]);

    if (
        difficulties.loading ||
        difficulties.error ||
        !difficulties.value ||
        difficulties.value.length === 0 ||
        generationMode !== 'Difficulty'
    ) {
        return null;
    }

    return (
        <FormControl>
            <InputLabel id="difficulty-label">Difficulty</InputLabel>
            <Select
                id="difficulty"
                labelId="difficulty-label"
                name="difficulty"
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                fullWidth
            >
                {difficulties.value.map((difficulty) => (
                    <MenuItem key={difficulty.id} value={difficulty.id}>
                        {difficulty.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export default function RoomCreateForm() {
    const { data: games, isLoading } = useApi<Game[]>('/api/games');
    const router = useRouter();

    if (isLoading) {
        return <CircularProgress />;
    }

    if (!games) {
        return 'Unable to load game list';
    }

    return (
        <Formik
            initialValues={{
                name: '',
                nickname: '',
                game: null,
                password: '',
                variant: '',
                mode: 'LINES',
                lineCount: 1,
                seed: undefined,
                generationMode: '',
                difficulty: '',
                hideCard: false,
            }}
            validationSchema={roomValidationSchema}
            onSubmit={async (values) => {
                const res = await fetch('/api/rooms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(values),
                });
                if (!res.ok) {
                    const error = await res.text();
                    alertError(`Unable to create room - ${error}`);
                    return;
                }
                const { slug, authToken } = await res.json();
                localStorage.setItem(
                    'PlayBingo.temp.nickname',
                    values.nickname,
                );
                localStorage.setItem(`authToken-${slug}`, authToken);
                router.push(`/rooms/${slug}`);
            }}
        >
            {({ values: { mode } }) => (
                <Form>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            rowGap: 2.5,
                            textAlign: 'left',
                        }}
                    >
                        <FormikTextField name="name" label="Room Name" />
                        <FormikTextField name="nickname" label="Nickname" />
                        <FormikTextField
                            id="roomPassword"
                            type="password"
                            name="password"
                            label="Password"
                        />
                        <FormikSelectFieldAutocomplete
                            id="gameSelect"
                            name="game"
                            label="Game"
                            options={games.map((game) => ({
                                label: game.name,
                                value: game.slug,
                            }))}
                        />
                        {/* <div>
                            <label>
                                <div>Variant</div>
                                <Field name="variant" />
                            </label>
                            <ErrorMessage name="variant" component="div" />
                        </div> */}
                        <Box
                            sx={{
                                display: 'flex',
                                width: '100%',
                                alignItems: 'center',
                                columnGap: 2,
                            }}
                        >
                            <FormikSelectField
                                id="room-mode-select"
                                name="mode"
                                label="Game Mode"
                                options={[
                                    { value: 'LINES', label: 'Lines' },
                                    { value: 'BLACKOUT', label: 'Blackout' },
                                    { value: 'LOCKOUT', label: 'Lockout' },
                                ]}
                                sx={{ flexGrow: 1 }}
                            />
                            {mode === 'LINES' && (
                                <NumberInput
                                    name="lineCount"
                                    label="Lines"
                                    disabled={mode !== 'LINES'}
                                />
                            )}
                        </Box>
                        <GenerationModeSelectField />
                        <DifficultySelectField />
                        <FormikSwitch
                            id="hide-card"
                            name="hideCard"
                            label="Hide card initially?"
                        />
                        <FormikSwitch
                            name="spectator"
                            id="spectator"
                            label="Join as spectator?"
                        />
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                Advanced Generation Options
                            </AccordionSummary>
                            <AccordionDetails
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    rowGap: 3,
                                }}
                            >
                                <FormikTextField
                                    type="number"
                                    name="seed"
                                    label="Seed"
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    fullWidth
                                />
                            </AccordionDetails>
                        </Accordion>
                        <Box
                            sx={{
                                display: 'flex',
                            }}
                        >
                            <Box
                                sx={{
                                    flexGrow: 1,
                                }}
                            />
                            <Button variant="contained" type="submit">
                                Create Room
                            </Button>
                        </Box>
                    </Box>
                </Form>
            )}
        </Formik>
    );
}
