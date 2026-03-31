'use client';
import { FormikSelectField } from '@/components/input/FormikSelectField';
import FormikSwitch from '@/components/input/FormikSwitch';
import FormikTextField from '@/components/input/FormikTextField';
import NumberInput from '@/components/input/NumberInput';
import { useApi } from '@/lib/Hooks';
import { alertError } from '@/lib/Utils';
import {
    Autocomplete,
    Description,
    EmptyState,
    FieldError,
    Button as HeroButton,
    Form as HeroForm,
    Input,
    Key,
    Label,
    ListBox,
    NumberField,
    SearchField,
    Select,
    Switch,
    TextField,
    useFilter,
} from '@heroui/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    CircularProgress,
    FormHelperText,
} from '@mui/material';
import { Game } from '@playbingo/types';
import { Form, Formik } from 'formik';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAsync } from 'react-use';
import * as yup from 'yup';
import GameModeSelector, {
    GameModeSelectorHero,
} from '../../../components/input/GameModeSelector';
import { RoomFormValues } from '../../../components/RoomCreateForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

const roomValidationSchema = yup.object().shape({
    name: yup.string().required('Room name is required'),
    nickname: yup.string().required('Player nickname is required'),
    password: yup.string().required('Password is required'),
    game: yup.string().required('Game is required'),
    variant: yup.string(),
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
                    .min(1, 'Must start with at least 1 revealed square')
                    .max(5, 'Cannot start with more than 5 goals revealed'),
            otherwise: (schema) => schema.notRequired(),
        }),
});

function VariantSelectField({ game }: { game: Key | null }) {
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
        <Select className="grow" isDisabled={disabled}>
            <Label>Variant</Label>
            <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
                <ListBox>
                    {options.value?.map((option) => (
                        <ListBox.Item
                            key={option.id}
                            id={option.id}
                            textValue={option.name}
                        >
                            {option.name}
                        </ListBox.Item>
                    ))}
                </ListBox>
            </Select.Popover>
            <FieldError />
            {disabled && (
                <FormHelperText>
                    {options.loading
                        ? 'Loading variants...'
                        : 'No variants available'}
                </FormHelperText>
            )}
        </Select>
    );
}

export default function HomePageRoomForm() {
    const { data: games, isLoading } = useApi<Game[]>('/api/games');
    const router = useRouter();
    const { contains } = useFilter({ sensitivity: 'base' });
    const [game, setGame] = useState<Key | null>('');

    if (isLoading) {
        return <CircularProgress />;
    }

    if (!games) {
        return 'Unable to load game list';
    }

    return (
        <>
            <HeroForm
                className="flex flex-col gap-4 text-left"
                onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = Object.fromEntries(formData);
                    console.log('Form data:', data);
                }}
            >
                <div className="flex gap-4">
                    <TextField name="name" isRequired className="grow">
                        <Label>Room Name</Label>
                        <Input placeholder="Room Name" />
                        <FieldError />
                    </TextField>
                    <TextField name="nickname" isRequired className="grow">
                        <Label>Nickname</Label>
                        <Input placeholder="Nickname" />
                        <FieldError />
                    </TextField>
                    <TextField name="password" isRequired className="grow">
                        <Label>Password</Label>
                        <Input placeholder="Password" />
                        <FieldError />
                    </TextField>
                </div>
                <div className="flex gap-4">
                    <Autocomplete
                        isRequired
                        className="grow"
                        value={game}
                        onChange={setGame}
                    >
                        <Label>Game</Label>
                        <Autocomplete.Trigger>
                            <Autocomplete.Value />
                            <Autocomplete.ClearButton />
                            <Autocomplete.Indicator />
                        </Autocomplete.Trigger>
                        <Autocomplete.Popover>
                            <Autocomplete.Filter filter={contains}>
                                <SearchField
                                    autoFocus
                                    name="search"
                                    variant="secondary"
                                >
                                    <SearchField.Group>
                                        <SearchField.SearchIcon />
                                        <SearchField.Input placeholder="Search games..." />
                                    </SearchField.Group>
                                </SearchField>
                                <ListBox
                                    renderEmptyState={() => (
                                        <EmptyState>No games found</EmptyState>
                                    )}
                                >
                                    {games.map((game) => (
                                        <ListBox.Item
                                            key={game.slug}
                                            id={game.slug}
                                            textValue={game.name}
                                        >
                                            {game.name}
                                            <ListBox.ItemIndicator />
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Autocomplete.Filter>
                        </Autocomplete.Popover>
                    </Autocomplete>
                    <VariantSelectField game={game} />
                </div>

                <GameModeSelectorHero />

                <div className="flex gap-4">
                    <Switch size="md" name="hideCard">
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Content>
                            <Label>Hide card initially?</Label>
                            <Description>
                                Hides the card for newly joining players.
                            </Description>
                        </Switch.Content>
                    </Switch>
                    <Switch size="md" name="spectator">
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Content>
                            <Label>Join as a spectator?</Label>
                            <Description>
                                Join the game as a spectator, who are unable to
                                interact directly with the board.
                            </Description>
                        </Switch.Content>
                    </Switch>
                </div>

                <div className="flex gap-4">
                    <Switch size="md" name="exploration">
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                        <Switch.Content>
                            <Label>Enable fog of war?</Label>
                            <Description>
                                Enables fog of war which obscures goals until an
                                adjacent cell has been completed.
                            </Description>
                        </Switch.Content>
                    </Switch>
                    <Select name="explorationStart">
                        <Label>Starting Square</Label>
                        <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                        </Select.Trigger>
                        <Description>
                            Select the location of the goal that will start the
                            game revealed in fog of war.
                        </Description>
                        <Select.Popover>
                            <ListBox>
                                {[
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
                                ].map((option) => (
                                    <ListBox.Item
                                        key={option.value}
                                        id={option.value}
                                        textValue={option.label}
                                    >
                                        <Label>{option.label}</Label>
                                        {option.tooltip && (
                                            <Description>
                                                {option.tooltip}
                                            </Description>
                                        )}
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                ))}
                            </ListBox>
                        </Select.Popover>
                    </Select>
                    <NumberField
                        id="exploration-random-revealed-count"
                        name="explorationStartCount"
                        className="w-full max-w-64"
                        minValue={1}
                        maxValue={5}
                        step={1}
                    >
                        <Label>Starting Square Count</Label>
                        <NumberField.Group>
                            <NumberField.DecrementButton />
                            <NumberField.Input />
                            <NumberField.IncrementButton />
                        </NumberField.Group>
                    </NumberField>
                </div>

                <HeroButton type="submit">Create Room</HeroButton>
            </HeroForm>

            <Formik<RoomFormValues>
                initialValues={{
                    name: '',
                    nickname: '',
                    game: '',
                    password: '',
                    variant: '',
                    mode: 'LINES',
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
                {({ values: { exploration, explorationStart } }) => (
                    <Box
                        component={Form}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            rowGap: 2,
                            textAlign: 'left',
                        }}
                    >
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
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Button
                                variant="outlined"
                                type="submit"
                                sx={{ width: '100%' }}
                            >
                                Create Room
                            </Button>
                        </Box>
                    </Box>
                )}
            </Formik>
        </>
    );
}
