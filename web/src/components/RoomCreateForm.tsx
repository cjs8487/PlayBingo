'use client';
import { alertError } from '@/lib/Utils';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import { Game } from '@playbingo/types';
import { Form, Formik, useField, useFormikContext } from 'formik';
import { useRouter } from 'next/navigation';
import { useAsync } from 'react-use';
import * as yup from 'yup';
import { useApi } from '../lib/Hooks';
import {
    FormikSelectField,
    FormikSelectFieldAutocomplete,
} from './input/FormikSelectField';
import FormikSwitch from './input/FormikSwitch';
import FormikTextField from './input/FormikTextField';
import NumberInput from './input/NumberInput';

const roomValidationSchema = yup.object().shape({
    name: yup.string().required('Room name is required'),
    nickname: yup.string().required('Player nickname is required'),
    password: yup.string().required('Password is required'),
    game: yup.string().required('Game is required'),
    variant: yup.string(),
    mode: yup
        .string()
        .required('Game mode is required')
        .oneOf(
            ['LINES', 'BLACKOUT', 'LOCKOUT', 'TRAVERSE'],
            'Invalid game mode',
        ),
    traversalDirection: yup
        .string()
        .oneOf(['UP', 'DOWN', 'LEFT', 'RIGHT'], 'Invalid traversal direction')
        .when('mode', {
            is: 'TRAVERSE',
            then: (schema) =>
                schema.required('Traversal direction is required'),
        }),
    explorationStart: yup
        .string()
        .oneOf(
            ['TL', 'TR', 'BL', 'BR', 'CENTER', 'RANDOM'],
            'Invalid starting square mode',
        )
        .when('exploration', {
            is: true,
            then: (schema) => schema.required('Starting square is required'),
            otherwise: (schema) => schema.notRequired(),
        }),
    explorationStartCount: yup
        .number()
        .when(['exploration', 'explorationStart', 'mode'], {
            is: (
                exploration: boolean,
                explorationStart: string,
                mode: string,
            ) =>
                exploration &&
                explorationStart === 'RANDOM' &&
                mode !== 'TRAVERSE',
            then: (schema) =>
                schema
                    .required('Start count is required')
                    .min(1, 'Must start with at least 1 revealed square')
                    .max(5, 'Cannot start with more than 5 goals revealed'),
            otherwise: (schema) => schema.notRequired(),
        }),
});

function VariantSelectField() {
    const {
        values: { game },
    } = useFormikContext<{ game: string }>();
    const [field, meta] = useField<string>('variant');

    const error = meta.touched && !!meta.error;

    const options = useAsync(async () => {
        if (!game) {
            return [];
        }

        const res = await fetch(`/api/games/${game}`);
        if (!res.ok) {
            return [];
        }
        const gameData: Game = await res.json();
        return [
            ...(gameData.difficultyVariants ?? []),
            ...(gameData.variants ?? []),
        ];
    }, [game]);

    const disabled = !options.value || options.value.length === 0;

    return (
        <FormControl>
            <InputLabel id="variant-label">Variant</InputLabel>
            <Select
                id="variant"
                labelId="variant-label"
                name="variant"
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                fullWidth
                label="Variant"
                disabled={disabled}
            >
                {options.value?.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                        {option.name}
                    </MenuItem>
                ))}
            </Select>
            {error && (
                <FormHelperText error={error}>{meta.error}</FormHelperText>
            )}
            {disabled && (
                <FormHelperText>
                    {options.loading
                        ? 'Loading variants...'
                        : 'No variants available'}
                </FormHelperText>
            )}
        </FormControl>
    );
}

interface FormProps {
    game?: string;
}

export default function RoomCreateForm({ game }: FormProps) {
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
                game,
                password: '',
                variant: '',
                mode: 'LINES',
                traversalDirection: 'UP',
                lineCount: 1,
                seed: undefined,
                hideCard: false,
                spectator: false,
                exploration: false,
                explorationStart: 'TL',
                explorationStartCount: '',
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
            {({ values: { mode, exploration, explorationStart } }) => (
                <Form style={{ width: '34rem', maxWidth: '100%' }}>
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
                        <VariantSelectField />
                        <Box>
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
                                        {
                                            value: 'BLACKOUT',
                                            label: 'Blackout',
                                        },
                                        { value: 'LOCKOUT', label: 'Lockout' },
                                        {
                                            value: 'TRAVERSE',
                                            label: 'Traverse',
                                        },
                                    ]}
                                    sx={{ flexGrow: 1 }}
                                />
                                {mode === 'TRAVERSE' && (
                                    <FormikSelectField
                                        id="traversal-direction-select"
                                        name="traversalDirection"
                                        label="Direction"
                                        options={[
                                            { value: 'UP', label: 'Climb (↑)' },
                                            {
                                                value: 'DOWN',
                                                label: 'Tumble (↓)',
                                            },
                                            {
                                                value: 'LEFT',
                                                label: 'Moonwalk (←)',
                                            },
                                            {
                                                value: 'RIGHT',
                                                label: 'Charge (→)',
                                            },
                                        ]}
                                        sx={{ minWidth: 120 }}
                                    />
                                )}
                                {mode === 'LINES' && (
                                    <NumberInput
                                        name="lineCount"
                                        label="Lines"
                                        disabled={mode !== 'LINES'}
                                    />
                                )}
                            </Box>
                            {mode === 'TRAVERSE' && (
                                <FormHelperText>
                                    Complete a connected path across the board.
                                    Only the starting edge is visible, and
                                    completing goals reveals adjacent cells,
                                    with the difficulty of the goals increasing
                                    as you move across the board.
                                </FormHelperText>
                            )}
                        </Box>
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
                        {mode !== 'TRAVERSE' && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <FormikSwitch
                                    name="exploration"
                                    id="exploration"
                                    label="Exploration"
                                />
                                <FormikSelectField
                                    id="exploration-start-select"
                                    name="explorationStart"
                                    label="Starting Square"
                                    disabled={!exploration}
                                    sx={{ flexGrow: 1 }}
                                    options={[
                                        { value: 'TL', label: 'Top Left' },
                                        { value: 'TR', label: 'Top Right' },
                                        { value: 'BL', label: 'Bottom Left' },
                                        { value: 'BR', label: 'Bottom Right' },
                                        {
                                            value: 'CENTER',
                                            label: 'Center',
                                            tooltip:
                                                'The center square of the board starts revealed. If the board has an even width or height, two squares will be revealed in that direction.',
                                        },
                                        {
                                            value: 'RANDOM',
                                            label: 'Random',
                                            tooltip:
                                                'A specified number of cells in the square will be chosen at random to start revealed',
                                        },
                                    ]}
                                />
                                <NumberInput
                                    id="exploration-random-revealed-count"
                                    name="explorationStartCount"
                                    label="Start Count"
                                    disabled={
                                        !exploration ||
                                        explorationStart !== 'RANDOM'
                                    }
                                    min={1}
                                    max={5}
                                />
                            </Box>
                        )}
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
