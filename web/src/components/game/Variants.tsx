import {
    Box,
    Button,
    IconButton,
    List,
    ListItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { DifficultyVariant, Game } from '../../types/Game';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import { FieldArray, Form, Formik } from 'formik';
import FormikTextField from '../input/FormikTextField';
import NumberInput from '../input/NumberInput';
import { useState } from 'react';
import { useList } from 'react-use';

interface DifficultyVariantEditRowProps {
    variant: DifficultyVariant;
    disabled: boolean;
    done: () => void;
}

function DificultyVariantEditRow({
    variant,
    disabled,
    done,
}: DifficultyVariantEditRowProps) {
    return (
        <Formik
            initialValues={{ ...variant }}
            onSubmit={() => {
                done();
            }}
            validateOnChange={false}
        >
            {({ resetForm }) => (
                <Form>
                    <Box display="flex" columnGap={1} alignItems="center">
                        <FormikTextField
                            name="name"
                            label="Name"
                            disabled={disabled}
                        />
                        <FieldArray name="goalAmounts">
                            {() =>
                                variant.goalAmounts?.map((_, index) => (
                                    <NumberInput
                                        key={index}
                                        name={`goalAmounts.${index}`}
                                        label={`${index}`}
                                        min={0}
                                        max={25}
                                        disabled={disabled}
                                    />
                                ))
                            }
                        </FieldArray>
                        {!disabled && (
                            <>
                                <IconButton
                                    edge="end"
                                    onClick={() => {
                                        resetForm(), done();
                                    }}
                                    color="error"
                                >
                                    <Close />
                                </IconButton>
                                <IconButton
                                    type="submit"
                                    edge="end"
                                    color="success"
                                >
                                    <Check />
                                </IconButton>
                            </>
                        )}
                    </Box>
                </Form>
            )}
        </Formik>
    );
}

interface DificultyVariantRow {
    variant: DifficultyVariant;
}

function DifficultyVariantRow({ variant }: DificultyVariantRow) {
    const [edit, setEdit] = useState(false);

    return (
        <ListItem
            key={variant.name}
            sx={{
                borderBottom: 1,
                borderColor: (theme) => theme.palette.divider,
            }}
        >
            <Box display="flex" columnGap={1} alignItems="center">
                <DificultyVariantEditRow
                    variant={variant}
                    disabled={!edit}
                    done={() => setEdit(false)}
                />
                {!edit && (
                    <IconButton edge="end" onClick={() => setEdit(true)}>
                        <Edit />
                    </IconButton>
                )}
            </Box>
        </ListItem>
    );
}

interface VariantsProps {
    gameData: Game;
}

export default function Variants({ gameData }: VariantsProps) {
    const [difficultyVariants, { push }] = useList<DifficultyVariant>(
        gameData.difficultyVariants ?? [],
    );
    if (!gameData.difficultyVariantsEnabled) {
        return null;
    }

    return (
        <>
            <Typography variant="h6">Difficulty Variants</Typography>
            <List>
                {difficultyVariants.map((variant) => (
                    <DifficultyVariantRow
                        key={variant.name}
                        variant={variant}
                    />
                ))}
            </List>

            <Box>
                <Button
                    startIcon={<Add />}
                    onClick={() => {
                        push({ name: '', goalAmounts: [0, 0, 0, 0] });
                    }}
                >
                    Add Variant
                </Button>
            </Box>
        </>
    );
}
