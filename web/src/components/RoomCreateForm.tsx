'use client';
import { useApi } from '@/lib/Hooks';
import { alertError } from '@/lib/Utils';
import { ArrowDropDown } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    CircularProgress,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material';
import { Game } from '@playbingo/types';
import type { BoardSizeOptions } from '@playbingo/shared';
import { Form, Formik, useFormikContext } from 'formik';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import * as yup from 'yup';
import {
    FormikSelectField,
    FormikSelectFieldAutocomplete,
} from './input/FormikSelectField';
import FormikSwitch from './input/FormikSwitch';
import FormikTextField from './input/FormikTextField';
import GameModeSelector from './input/GameModeSelector';
import NumberInput from './input/NumberInput';
import VariantSelectField from './input/VariantSelectField';

type RoomBoardSize = number | 'custom';

const roomValidationSchema = yup.object().shape({
    name: yup.string().required('Room name is required'),
    nickname: yup.string().required('Player nickname is required'),
    password: yup.string().required('Password is required'),
    game: yup.string().required('Game is required'),
    variant: yup.string(),
    boardSize: yup
        .mixed<RoomBoardSize>()
        .required('Board size is required')
        .test('available', 'Select an available board size', function (value) {
            return (
                value !== undefined && this.parent.boardSizes.includes(value)
            );
        }),
    mode: yup
        .string()
        .required('Game mode is required')
        .oneOf(['LINES', 'BLACKOUT', 'LOCKOUT'], 'Invalid game mode'),
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
        .when(['exploration', 'explorationStart'], {
            is: (exploration: boolean, explorationStart: string) =>
                exploration && explorationStart === 'RANDOM',
            then: (schema) =>
                schema
                    .required('Start count is required')
                    .integer()
                    .min(1, 'Must start with at least 1 revealed square')
                    .max(5, 'Cannot start with more than 5 goals revealed'),
            otherwise: (schema) => schema.notRequired(),
        }),
});

function BoardSizeSelectField() {
    const {
        values: { game, variant, boardSize },
        setValues,
        setFieldValue,
    } = useFormikContext<RoomFormValues>();
    const { data, isLoading, error } = useSWR<BoardSizeOptions>(
        game
            ? `/api/games/${encodeURIComponent(game)}/boardSizes?${new URLSearchParams({ variant })}`
            : null,
        async (url: string) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Unable to load board sizes');
            return response.json();
        },
    );
    const options = useMemo<{ value: RoomBoardSize; label: string }[]>(() => {
        if (data?.customLayout) {
            const { width, height } = data.customLayout;
            return [{ value: 'custom', label: `${width} × ${height}` }];
        }
        return (data?.sizes ?? []).map((size) => ({
            value: size,
            label: `${size} × ${size}`,
        }));
    }, [data]);

    useEffect(() => {
        const allowed = options.map(({ value }) => value);
        setValues((values) => ({
            ...values,
            boardSizes: allowed,
            boardSize: options.some(({ value }) => value === values.boardSize)
                ? values.boardSize
                : allowed.includes(5)
                  ? 5
                  : (allowed[0] ?? ''),
        }));
    }, [game, variant, options, setValues]);

    let helperText;
    if (isLoading) helperText = 'Loading sizes...';
    else if (error) helperText = 'Unable to load board sizes';
    else if (game && !options.length)
        helperText = 'No sizes available for this game and variant';
    else if (data?.customLayout) helperText = 'Size fixed by the custom layout';

    return (
        <TextField
            select
            id="board-size"
            name="boardSize"
            label="Board Size"
            value={
                options.find(({ value }) => value === boardSize)?.value ?? ''
            }
            disabled={options.length <= 1}
            error={!!error || (!!game && !isLoading && !options.length)}
            fullWidth
            helperText={helperText}
            onChange={(event) =>
                setFieldValue(
                    'boardSize',
                    event.target.value === 'custom'
                        ? 'custom'
                        : Number(event.target.value),
                )
            }
        >
            {options.map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                    {label}
                </MenuItem>
            ))}
        </TextField>
    );
}
export interface RoomFormValues {
    name: string;
    nickname: string;
    game: string | null;
    password: string;
    variant: string;
    boardSize: RoomBoardSize | '';
    boardSizes: RoomBoardSize[];
    mode: 'LINES' | 'BLACKOUT' | 'LOCKOUT';
    lineCount: number;
    seed: number | '';
    hideCard: boolean;
    spectator: boolean;
    teamsEnabled: boolean;
    exploration: boolean;
    explorationStart: 'TL' | 'TR' | 'BL' | 'BR' | 'CENTER' | 'RANDOM';
    explorationStartCount: number | '';
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
        <Formik<RoomFormValues>
            initialValues={{
                name: '',
                nickname: '',
                game: game ?? '',
                boardSize: '',
                boardSizes: [],
                password: '',
                variant: '',
                mode: 'LINES',
                lineCount: 1,
                seed: '',
                hideCard: false,
                spectator: false,
                teamsEnabled: false,
                exploration: false,
                explorationStart: 'TL',
                explorationStartCount: '',
            }}
            validationSchema={roomValidationSchema}
            onSubmit={async ({ boardSize, boardSizes, seed, ...values }) => {
                if (!boardSize || !boardSizes.includes(boardSize)) return;

                try {
                    const res = await fetch('/api/rooms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...values,
                            boardSize:
                                boardSize === 'custom' ? undefined : boardSize,
                            seed: seed === '' ? undefined : seed,
                        }),
                    });
                    if (!res.ok) {
                        alertError(
                            `Unable to create room - ${await res.text()}`,
                        );
                        return;
                    }

                    const { slug, authToken } = await res.json();
                    localStorage.setItem(
                        'PlayBingo.temp.nickname',
                        values.nickname,
                    );
                    localStorage.setItem(`authToken-${slug}`, authToken);
                    router.push(`/rooms/${slug}`);
                } catch {
                    alertError('Unable to create room. Please try again.');
                }
            }}
        >
            {({
                values: {
                    exploration,
                    explorationStart,
                    boardSize,
                    boardSizes,
                },
                setValues,
                setFieldValue,
                submitForm,
                isSubmitting,
            }) => (
                <Box
                    component={Form}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                        }}
                    >
                        <FormikTextField
                            id="room-name"
                            name="name"
                            label="Room Name"
                            fullWidth
                        />

                        <FormikTextField
                            id="room-password"
                            name="password"
                            label="Password"
                            fullWidth
                            type="password"
                        />
                        <FormikTextField
                            id="player-nickname"
                            name="nickname"
                            label="Nickname"
                            fullWidth
                        />
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                        }}
                    >
                        <FormikSelectFieldAutocomplete
                            id="game-select"
                            name="game"
                            label="Game"
                            options={games.map((game) => ({
                                label: game.name,
                                value: game.slug,
                            }))}
                            onValueChange={(nextGame) =>
                                setValues((values) => ({
                                    ...values,
                                    game: nextGame,
                                    variant: '',
                                    boardSizes: [],
                                }))
                            }
                            fullWidth
                        />
                        <VariantSelectField fullWidth />
                        <BoardSizeSelectField />
                    </Box>
                    <GameModeSelector />
                    <Accordion className="bg-surface">
                        <AccordionSummary expandIcon={<ArrowDropDown />}>
                            <Typography>Advanced Settings</Typography>
                        </AccordionSummary>
                        <AccordionDetails
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                }}
                            >
                                <FormikSwitch
                                    id="hide-card"
                                    name="hideCard"
                                    label="Hide card initially?"
                                />
                                <FormikSwitch
                                    id="enable-teams"
                                    name="teamsEnabled"
                                    label="Enable teams"
                                />
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                }}
                            >
                                <FormikSwitch
                                    id="exploration-toggle"
                                    name="exploration"
                                    label="Enable fog of war?"
                                />
                                <FormikSelectField
                                    id="exploration-start"
                                    name="explorationStart"
                                    label="Starting Square"
                                    disabled={!exploration}
                                    sx={{
                                        flexGrow: 1,
                                        textAlign: 'left',
                                    }}
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
                                    label="Starting Square Count"
                                    min={1}
                                    max={5}
                                    disabled={
                                        !exploration ||
                                        explorationStart !== 'RANDOM'
                                    }
                                />
                            </Box>
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
                            gap: 2,
                            width: '100%',
                        }}
                    >
                        <Box sx={{ flexGrow: 1 }} />
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                flexWrap: 'wrap',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Button
                                type="button"
                                disabled={
                                    isSubmitting ||
                                    !boardSize ||
                                    !boardSizes.includes(boardSize)
                                }
                                color="secondary"
                                onClick={async () => {
                                    await setFieldValue('spectator', true);
                                    await submitForm();
                                }}
                            >
                                Create As Spectator
                            </Button>

                            <Button
                                type="button"
                                disabled={
                                    isSubmitting ||
                                    !boardSize ||
                                    !boardSizes.includes(boardSize)
                                }
                                onClick={async () => {
                                    await setFieldValue('spectator', false);
                                    await submitForm();
                                }}
                            >
                                Create Room
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}
        </Formik>
    );
}
