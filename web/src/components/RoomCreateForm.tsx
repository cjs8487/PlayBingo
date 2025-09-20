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
    InputLabel,
    MenuItem,
    Select,
    Typography,
} from '@mui/material';
import { Game, Cell } from '@playbingo/types';

// Simplified type for custom board input - makes optional fields truly optional
type CellExample = {
    goal: {
        id?: string;
        goal: string;
        description?: string | null;
        difficulty?: number | null;
        categories?: string[];
    };
    completedPlayers?: string[];
};
import { Form, Formik, useField, useFormikContext } from 'formik';
import { useRouter } from 'next/navigation';
import { useAsync } from 'react-use';
import { useState } from 'react';
import * as yup from 'yup';
import { useApi } from '../lib/Hooks';
import {
    FormikSelectField,
    FormikSelectFieldAutocomplete,
} from './input/FormikSelectField';
import FormikSwitch from './input/FormikSwitch';
import FormikTextField from './input/FormikTextField';
import NumberInput from './input/NumberInput';
import CustomBoardEditor from './CustomBoardEditor';

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
    customBoard: yup.boolean(),
    customBoardData: yup.string().when('customBoard', {
        is: true,
        then: (schema) =>
            schema.required(
                'Custom board data is required when custom board is enabled',
            ),
        otherwise: (schema) => schema.notRequired(),
    }),
});

// Enhanced validation function with detailed error reporting
const validateCustomBoardDetailed = (boardData: string) => {
    try {
        const parsed = JSON.parse(boardData);

        // Check if it's an array of arrays
        if (!Array.isArray(parsed)) {
            return {
                valid: false,
                error: 'Board must be an array of rows',
                location: 'root',
                suggestion: 'Wrap your data in square brackets: [...]',
            };
        }

        if (parsed.length !== 5) {
            return {
                valid: false,
                error: `Board must have exactly 5 rows, found ${parsed.length}`,
                location: 'root',
                suggestion: 'Add or remove rows to make exactly 5 rows',
            };
        }

        // Check total size limit
        if (JSON.stringify(parsed).length > 50000) {
            return {
                valid: false,
                error: 'Board data is too large (max 50KB)',
                location: 'root',
                suggestion:
                    'Reduce the content size or split into smaller boards',
            };
        }

        for (let i = 0; i < parsed.length; i++) {
            if (!Array.isArray(parsed[i])) {
                return {
                    valid: false,
                    error: `Row ${i + 1} must be an array`,
                    location: `row-${i + 1}`,
                    suggestion: 'Wrap row data in square brackets: [...]',
                };
            }

            if (parsed[i].length !== 5) {
                return {
                    valid: false,
                    error: `Row ${i + 1} must have exactly 5 cells, found ${parsed[i].length}`,
                    location: `row-${i + 1}`,
                    suggestion:
                        'Add or remove cells to make exactly 5 cells in this row',
                };
            }

            for (let j = 0; j < parsed[i].length; j++) {
                const cell = parsed[i][j];
                if (!cell || typeof cell !== 'object') {
                    return {
                        valid: false,
                        error: `Cell at row ${i + 1}, col ${j + 1} must be an object`,
                        location: `cell-${i + 1}-${j + 1}`,
                        suggestion: 'Wrap cell data in curly braces: {...}',
                    };
                }

                if (!cell.goal || typeof cell.goal !== 'object') {
                    return {
                        valid: false,
                        error: `Cell at row ${i + 1}, col ${j + 1} must have a goal object`,
                        location: `cell-${i + 1}-${j + 1}`,
                        suggestion:
                            'Add a "goal" property with an object value',
                    };
                }

                if (!cell.goal.goal || typeof cell.goal.goal !== 'string') {
                    return {
                        valid: false,
                        error: `Cell at row ${i + 1}, col ${j + 1} goal must have a goal string`,
                        location: `cell-${i + 1}-${j + 1}`,
                        suggestion:
                            'Add a "goal" property with a string value inside the goal object',
                    };
                }

                if (cell.goal.goal.length > 255) {
                    return {
                        valid: false,
                        error: `Cell at row ${i + 1}, col ${j + 1} goal text is too long (max 255 characters)`,
                        location: `cell-${i + 1}-${j + 1}`,
                        suggestion: `Shorten the goal text (currently ${cell.goal.goal.length} characters)`,
                    };
                }

                if (cell.goal.goal.trim().length === 0) {
                    return {
                        valid: false,
                        error: `Cell at row ${i + 1}, col ${j + 1} goal cannot be empty`,
                        location: `cell-${i + 1}-${j + 1}`,
                        suggestion: 'Add some text for the goal',
                    };
                }

                // Frontend validation is more lenient - missing optional fields will be auto-added
                // We only validate structure and content, not completeness

                // Validate goal object has only allowed fields
                const allowedGoalFields = [
                    'id',
                    'goal',
                    'description',
                    'difficulty',
                    'categories',
                ];
                const goalFields = Object.keys(cell.goal);
                const invalidGoalFields = goalFields.filter(
                    (field) => !allowedGoalFields.includes(field),
                );
                if (invalidGoalFields.length > 0) {
                    return {
                        valid: false,
                        error: `Cell at row ${i + 1}, col ${j + 1} goal object contains invalid fields: ${invalidGoalFields.join(', ')}`,
                        location: `cell-${i + 1}-${j + 1}`,
                        suggestion: `Remove invalid fields. Allowed fields are: ${allowedGoalFields.join(', ')}`,
                    };
                }

                // Validate cell object has only allowed fields
                const allowedCellFields = ['goal', 'completedPlayers'];
                const cellFields = Object.keys(cell);
                const invalidCellFields = cellFields.filter(
                    (field) => !allowedCellFields.includes(field),
                );
                if (invalidCellFields.length > 0) {
                    return {
                        valid: false,
                        error: `Cell at row ${i + 1}, col ${j + 1} contains invalid fields: ${invalidCellFields.join(', ')}`,
                        location: `cell-${i + 1}-${j + 1}`,
                        suggestion: `Remove invalid fields. Allowed fields are: ${allowedCellFields.join(', ')}`,
                    };
                }

                // Validate completedPlayers if present
                if (cell.completedPlayers !== undefined) {
                    if (!Array.isArray(cell.completedPlayers)) {
                        return {
                            valid: false,
                            error: `Cell at row ${i + 1}, col ${j + 1} completedPlayers must be an array`,
                            location: `cell-${i + 1}-${j + 1}`,
                            suggestion:
                                'Set completedPlayers to an array or remove it entirely',
                        };
                    }
                }

                // Validate goal.description if present
                if (
                    cell.goal.description !== undefined &&
                    cell.goal.description !== null
                ) {
                    if (typeof cell.goal.description !== 'string') {
                        return {
                            valid: false,
                            error: `Cell at row ${i + 1}, col ${j + 1} goal description must be a string`,
                            location: `cell-${i + 1}-${j + 1}`,
                            suggestion:
                                'Set description to a string or remove it entirely',
                        };
                    }
                    if (cell.goal.description.length > 500) {
                        return {
                            valid: false,
                            error: `Cell at row ${i + 1}, col ${j + 1} goal description is too long (max 500 characters)`,
                            location: `cell-${i + 1}-${j + 1}`,
                            suggestion: `Shorten the description (currently ${cell.goal.description.length} characters)`,
                        };
                    }
                }

                // Validate goal.difficulty if present
                if (
                    cell.goal.difficulty !== undefined &&
                    cell.goal.difficulty !== null
                ) {
                    if (
                        typeof cell.goal.difficulty !== 'number' ||
                        !Number.isInteger(cell.goal.difficulty) ||
                        cell.goal.difficulty < 0
                    ) {
                        return {
                            valid: false,
                            error: `Cell at row ${i + 1}, col ${j + 1} goal difficulty must be a non-negative integer`,
                            location: `cell-${i + 1}-${j + 1}`,
                            suggestion:
                                'Set difficulty to a number or remove it entirely',
                        };
                    }
                }

                // Validate goal.categories if present
                if (
                    cell.goal.categories !== undefined &&
                    cell.goal.categories !== null
                ) {
                    if (!Array.isArray(cell.goal.categories)) {
                        return {
                            valid: false,
                            error: `Cell at row ${i + 1}, col ${j + 1} goal categories must be an array`,
                            location: `cell-${i + 1}-${j + 1}`,
                            suggestion:
                                'Set categories to an array or remove it entirely',
                        };
                    }
                    const invalidCategories = cell.goal.categories.filter(
                        (cat: unknown) => typeof cat !== 'string',
                    );
                    if (invalidCategories.length > 0) {
                        return {
                            valid: false,
                            error: `Cell at row ${i + 1}, col ${j + 1} goal categories must contain only strings`,
                            location: `cell-${i + 1}-${j + 1}`,
                            suggestion: 'All category items must be strings',
                        };
                    }
                }
            }
        }

        return { valid: true, error: null, location: null, suggestion: null };
    } catch {
        return {
            valid: false,
            error: 'Invalid JSON format',
            location: 'root',
            suggestion: 'Check for missing commas, brackets, or quotes',
        };
    }
};

// Custom board component
function CustomBoardField() {
    const [field, meta, helpers] = useField('customBoardData');
    const { values } = useFormikContext<{ customBoard: boolean }>();
    const [validationError, setValidationError] = useState<string>('');
    const [fileInputKey, setFileInputKey] = useState(0);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        error: string | null;
        location: string | null;
        suggestion: string | null;
    } | null>(null);

    const handleVerify = () => {
        const result = validateCustomBoardDetailed(field.value || '');
        setValidationResult(result);

        if (!result.valid) {
            setValidationError(result.error || 'Validation failed');
        } else {
            setValidationError('');
            // Don't modify user input - just show success
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                helpers.setValue(content);
                setValidationError('');
                setValidationResult(null);
            };
            reader.readAsText(file);
        }
        setFileInputKey((prev) => prev + 1);
    };

    const handleTextChange = (value: string) => {
        helpers.setValue(value);
        setValidationError('');
        setValidationResult(null);
    };

    const generateExampleBoard = () => {
        const exampleBoard: CellExample[][] = Array(5)
            .fill(null)
            .map((_, row) =>
                Array(5)
                    .fill(null)
                    .map((_, col) => ({
                        goal: {
                            goal: `Example Goal ${row + 1}-${col + 1}`,
                            description: `This is an example goal for row ${row + 1}, column ${col + 1}`,
                        },
                        // completedPlayers and goal.id are optional - will be auto-generated
                    })),
            );
        const jsonString = JSON.stringify(exampleBoard, null, 2);
        helpers.setValue(jsonString);
        setValidationError('');
        setValidationResult(null);
    };

    const generateAdvancedExampleBoard = () => {
        const exampleBoard: Cell[][] = Array(5)
            .fill(null)
            .map((_, row) =>
                Array(5)
                    .fill(null)
                    .map((_, col) => ({
                        goal: {
                            id: `custom-${row}-${col}`,
                            goal: `Advanced Goal ${row + 1}-${col + 1}`,
                            description: `This is an advanced example goal for row ${row + 1}, column ${col + 1}`,
                            difficulty: Math.floor(Math.random() * 5) + 1,
                            categories: [
                                `Category ${(row % 3) + 1}`,
                                `Type ${(col % 2) + 1}`,
                            ],
                        },
                        completedPlayers: [],
                    })),
            );
        const jsonString = JSON.stringify(exampleBoard, null, 2);
        helpers.setValue(jsonString);
        setValidationError('');
        setValidationResult(null);
    };

    if (!values.customBoard) {
        return null;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Custom Board</Typography>
            <Typography variant="body2" color="text.secondary">
                Upload a JSON file or paste board data. Must be a 5x5 grid.
                &quot;Simple Example&quot; for basic goals, or &quot;Advanced
                Example&quot; for full structure with all fields. Randomization
                uses the same generation mode and seed as normal boards.
            </Typography>

            <CustomBoardEditor
                value={field.value || ''}
                onChange={handleTextChange}
                onVerify={handleVerify}
                validationResult={validationResult}
                onFileUpload={handleFileUpload}
                onGenerateExample={generateExampleBoard}
                onGenerateAdvanced={generateAdvancedExampleBoard}
                fileInputKey={fileInputKey}
                helperText={
                    validationError ||
                    meta.error ||
                    'Paste your 5x5 board JSON here. Only "goal" text is required - other fields will be auto-added when creating the room.'
                }
            />
        </Box>
    );
}

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
                lineCount: 1,
                seed: undefined,
                generationMode: '',
                difficulty: '',
                hideCard: false,
                customBoard: false,
                customBoardData: '',
            }}
            validationSchema={roomValidationSchema}
            onSubmit={async (values) => {
                // Normalize custom board data before sending
                const normalizedValues = { ...values };
                if (values.customBoard && values.customBoardData) {
                    // Normalize the custom board data
                    try {
                        const parsed = JSON.parse(values.customBoardData);

                        // Normalize each cell to match schema requirements
                        for (let i = 0; i < parsed.length; i++) {
                            for (let j = 0; j < parsed[i].length; j++) {
                                const cell = parsed[i][j];

                                // Add missing required fields
                                if (!cell.completedPlayers) {
                                    cell.completedPlayers = [];
                                }

                                if (!cell.goal.id) {
                                    cell.goal.id = `custom-${i}-${j}`;
                                }

                                if (cell.goal.description === undefined) {
                                    cell.goal.description = null;
                                }
                            }
                        }

                        normalizedValues.customBoardData = JSON.stringify(
                            parsed,
                            null,
                            2,
                        );
                    } catch {
                        // If parsing fails, use original data
                        normalizedValues.customBoardData =
                            values.customBoardData;
                    }
                }

                const res = await fetch('/api/rooms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(normalizedValues),
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
                        <FormikSwitch
                            name="customBoard"
                            id="customBoard"
                            label="Use custom board?"
                        />
                        <CustomBoardField />
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
