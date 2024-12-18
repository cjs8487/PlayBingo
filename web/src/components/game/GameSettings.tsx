import Info from '@mui/icons-material/Info';
import {
    Box,
    Button,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import {
    ErrorMessage,
    Field,
    FieldArray,
    Form,
    Formik,
    useField,
    useFormikContext,
} from 'formik';
import { useAsync, useList } from 'react-use';
import { mutate } from 'swr';
import { alertError, notifyMessage } from '../../lib/Utils';
import { Game } from '../../types/Game';
import HoverIcon from '../HoverIcon';
import FormikSwitch from '../input/FormikSwitch';
import FormikTextField from '../input/FormikTextField';
import NumberInput from '../input/NumberInput';
import Delete from '@mui/icons-material/Delete';
import { useConfirm } from 'material-ui-confirm';
import { useRouter } from 'next/navigation';

async function validateRacetimeCategory(value: string) {
    if (value) {
        const res = await fetch(`http://localhost:8000/${value}/data`);
        if (!res.ok) {
            return 'Invalid slug';
        }
    }
}

function RacetimeSettings() {
    const {
        values: { racetimeCategory },
    } = useFormikContext<{ racetimeCategory: string }>();
    const [field, meta] = useField<string>('racetimeGoal');

    const goals = useAsync(async () => {
        const res = await fetch(
            `http://localhost:8000/${racetimeCategory}/data`,
        );
        if (res.ok) {
            const data = await res.json();
            return data.goals as string[];
        }
        return [];
    }, [racetimeCategory]);

    return (
        <>
            <Box display="flex" width="100%" columnGap={2}>
                <Box
                    display="flex"
                    columnGap={1}
                    alignItems="center"
                    flexGrow={1}
                >
                    <FormikTextField
                        id="game-racetime-category"
                        name="racetimeCategory"
                        label="Racetime Category Slug"
                        validate={validateRacetimeCategory}
                        fullWidth
                    />
                    <HoverIcon icon={<Info />}>
                        <Typography variant="caption">
                            This is the short name that appears in racetime URLs
                            pointing to category resources, such as race rooms.
                        </Typography>
                    </HoverIcon>
                </Box>
                <FormControl sx={{ flexGrow: 3 }}>
                    <InputLabel id="racetime-goal-label">
                        Racetime Goal
                    </InputLabel>
                    <Select
                        id="racetime-goal"
                        labelId="racetime-goal-label"
                        name="racetimeGoal"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        fullWidth
                    >
                        {goals.value?.map((goal) => (
                            <MenuItem key={goal} value={goal}>
                                {goal}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        </>
    );
}

interface GameSettingsProps {
    gameData: Game;
}

export default function GameSettings({ gameData }: GameSettingsProps) {
    const confirm = useConfirm();
    const router = useRouter();
    return (
        <div>
            <Box display="flex">
                <Typography variant="h5" align="center" flexGrow={1}>
                    Game Settings
                </Typography>
                <Button
                    sx={{ float: 'right' }}
                    color="error"
                    startIcon={<Delete />}
                    onClick={async () => {
                        try {
                            await confirm({
                                title: 'Delete game?',
                                description:
                                    'Are you sure you want to delete this game? This cannot be undone.',
                                confirmationText: 'Delete',
                                confirmationButtonProps: {
                                    color: 'error',
                                },
                            });
                            const res = await fetch(
                                `/api/games/${gameData.slug}`,
                                { method: 'DELETE' },
                            );
                            if (!res.ok) {
                                alertError(
                                    `Unable to delete game - ${await res.text()}`,
                                );
                                return;
                            }
                            router.push('/games');
                            notifyMessage('Game deleted');
                        } catch {
                            // do nothing when dialog is canceled/dismissed
                        }
                    }}
                >
                    Delete Game
                </Button>
            </Box>
            <Formik
                initialValues={{
                    name: gameData.name,
                    coverImage: gameData.coverImage,
                    enableSRLv5: gameData.enableSRLv5,
                    racetimeCategory: gameData.racetimeCategory,
                    racetimeGoal: gameData.racetimeGoal,
                    difficultyVariantsEnabled:
                        gameData.difficultyVariantsEnabled,
                    difficultyGroups: gameData.difficultyGroups ?? 0,
                    slugWords: gameData.slugWords?.join('\n') ?? '',
                    useTypedRandom: gameData.useTypedRandom,
                }}
                onSubmit={async ({
                    name,
                    coverImage,
                    enableSRLv5,
                    racetimeCategory,
                    racetimeGoal,
                    difficultyVariantsEnabled,
                    difficultyGroups,
                    slugWords,
                    useTypedRandom,
                }) => {
                    const res = await fetch(`/api/games/${gameData.slug}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name,
                            coverImage,
                            enableSRLv5,
                            racetimeCategory,
                            racetimeGoal,
                            difficultyVariantsEnabled,
                            difficultyGroups,
                            slugWords: slugWords.split('\n'),
                            useTypedRandom,
                        }),
                    });
                    if (!res.ok) {
                        const error = await res.text();
                        alertError(`Failed to update game - ${error}`);
                        return;
                    }
                    mutate(`/api/games/${gameData.slug}`);
                }}
            >
                <Form>
                    <Box
                        display="flex"
                        flexDirection="column"
                        justifyItems="center"
                        rowGap={2}
                        pt={2}
                    >
                        <FormikTextField
                            id="game-name"
                            name="name"
                            label="Name"
                        />
                        <FormikTextField
                            id="game-cover-image"
                            name="coverImage"
                            label="Cover Image"
                        />
                        <Box display="flex" alignItems="center">
                            <FormikSwitch
                                id="game-srlv5-generation-switch"
                                label="Enable SRLv5 Board Generation"
                                name="enableSRLv5"
                            />
                            <HoverIcon icon={<Info />}>
                                <Typography variant="caption">
                                    SRLv5 generation requires goals to have a
                                    difficulty value assigned to them in order
                                    to be used in generation. The generator uses
                                    the difficulty value to balance each row,
                                    column, and diagonal, by having the
                                    difficulty of goals in each sum to the same
                                    value. It also tries to minimize synergy
                                    between goals in the same line by minimizing
                                    the category overlap.
                                </Typography>
                            </HoverIcon>
                        </Box>
                        <Box display="flex" alignItems="center" columnGap={3}>
                            <Box display="flex" alignItems="center">
                                <FormikSwitch
                                    id="game-difficulty-variants-switch"
                                    label="Enable Difficulty Variants"
                                    name="difficultyVariantsEnabled"
                                />
                                <HoverIcon icon={<Info />}>
                                    <Typography variant="caption">
                                        Difficulty varaints are a special type
                                        of variants that modify generation
                                        instead of the goal list. Difficulty
                                        variants modify how many goals from a
                                        given difficulty are selected during
                                        generation, which can impact the
                                        difficulty or length of the final board.
                                        When a difficulty variant is chosen,
                                        only the Random generation mode is
                                        available.
                                    </Typography>
                                </HoverIcon>
                            </Box>
                            <Box
                                display="flex"
                                alignItems="center"
                                columnGap={1}
                            >
                                <NumberInput
                                    name="difficultyGroups"
                                    label="Difficulty Groups"
                                    min={0}
                                    max={25}
                                />
                                <HoverIcon icon={<Info />}>
                                    <Typography variant="caption">
                                        Difficulty groups is the number of
                                        groups goals are grouped into for
                                        generating a board for a difficulty
                                        variant. The available goal difficulties
                                        will be split into equal sized groups
                                        based on this number. For example, if
                                        there are 5 groups and 25 difficulties,
                                        every 5 difficulties would be a group
                                        (1-5, 6-10, etc.). Setting this to 0 is
                                        equivalent to disabling difficulty
                                        variants, as the generator will be
                                        unable to generate a board with 0
                                        groups.
                                    </Typography>
                                </HoverIcon>
                            </Box>
                        </Box>
                        <Box display="flex" alignItems="center">
                            <FormikSwitch
                                id="game-typed-random-switch"
                                label="Enable Category-Random Generation"
                                name="useTypedRandom"
                            />
                            <HoverIcon icon={<Info />}>
                                <Typography variant="caption">
                                    Category-Random generation allows random
                                    generation to apply the typed restrictions
                                    of SRLv5 generation, which attempts to
                                    minimize the category overlap of each line.
                                    Category-Random replaces Random generation.
                                </Typography>
                            </HoverIcon>
                        </Box>
                        {gameData.racetimeBeta && <RacetimeSettings />}
                        <Box>
                            <Box display="flex" columnGap={1}>
                                <Typography>Slug Words</Typography>
                                <HoverIcon icon={<Info />}>
                                    <Typography variant="caption">
                                        Custom list of words to be used when
                                        generating room URLs for this category.
                                        Replaces the second word of the slug,
                                        which is normally a noun. If provided,
                                        you must provide at least 50 unique
                                        words to use, and will completely
                                        replace the default list. The more words
                                        you supply, the lower the chance that
                                        there is a room name collision during
                                        generation.
                                    </Typography>
                                </HoverIcon>
                            </Box>
                            <FormikTextField
                                id="game-slug-words"
                                name="slugWords"
                                label=""
                                rows={7}
                                multiline
                                fullWidth
                                validate={(value: string) => {
                                    const words = value.split('\n');
                                    if (words.length < 50) {
                                        return 'At least 50 words are required';
                                    }
                                    let error = '';
                                    words.forEach((word) => {
                                        if (!word.match(/^[a-zA-Z]*$/)) {
                                            error =
                                                'Slug words can only contain letters';
                                        }
                                    });
                                    return error;
                                }}
                            />
                            <Typography variant="caption">
                                Enter each word on a new line. No numbers or
                                special characters are allowed.
                            </Typography>
                        </Box>
                        <Box pt={1} display="flex">
                            <Box flexGrow={1} />
                            <Button
                                type="submit"
                                variant="contained"
                                color="success"
                            >
                                Save Changes
                            </Button>
                        </Box>
                    </Box>
                </Form>
            </Formik>
        </div>
    );
}
