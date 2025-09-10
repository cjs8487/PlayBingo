'use client';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import { Box, IconButton, List, ListItem, Typography } from '@mui/material';
import { DifficultyVariant, Game } from '@playbingo/types';
import { FieldArray, Form, Formik } from 'formik';
import { useState } from 'react';
import { mutate } from 'swr';
import { alertError } from '@/lib/Utils';
import FormikTextField from '@/components/input/FormikTextField';
import NumberInput from '@/components/input/NumberInput';

interface DifficultyVariantEditRowProps {
    slug: string;
    variant: DifficultyVariant;
    disabled: boolean;
    done: () => void;
}

function DificultyVariantEditRow({
    slug,
    variant,
    disabled,
    done,
}: DifficultyVariantEditRowProps) {
    return (
        <Formik
            initialValues={{ ...variant }}
            onSubmit={async ({ name, goalAmounts }) => {
                let res: Response;
                if (variant.id) {
                    res = await fetch(
                        `/api/games/${slug}/difficultyVariants/${variant.id}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name, goalAmounts }),
                        },
                    );
                } else {
                    res = await fetch(`/api/games/${slug}/difficultyVariants`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, goalAmounts }),
                    });
                }

                if (!res.ok) {
                    alertError(`Unable to save difficulty variant`);
                    return;
                }
                mutate(`/api/games/${slug}`);
                done();
            }}
            validateOnChange={false}
        >
            {({ resetForm }) => (
                <Form>
                    <Box
                        sx={{
                            display: 'flex',
                            columnGap: 1,
                            alignItems: 'center',
                        }}
                    >
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
                                        resetForm();
                                        done();
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
    slug: string;
    variant: DifficultyVariant;
}

function DifficultyVariantRow({ slug, variant }: DificultyVariantRow) {
    const [edit, setEdit] = useState(false);

    return (
        <ListItem
            key={variant.name}
            sx={{
                borderBottom: 1,
                borderColor: (theme) => theme.palette.divider,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    columnGap: 1,
                    alignItems: 'center',
                }}
            >
                <DificultyVariantEditRow
                    slug={slug}
                    variant={variant}
                    disabled={!edit}
                    done={() => setEdit(false)}
                />
                {!edit && (
                    <IconButton edge="end" onClick={() => setEdit(true)}>
                        <Edit />
                    </IconButton>
                )}
                <IconButton
                    edge="end"
                    onClick={async () => {
                        const res = await fetch(
                            `/api/games/${slug}/difficultyVariants/${variant.id}`,
                            {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                            },
                        );

                        if (!res.ok) {
                            alertError(`Unable to delete difficulty variant`);
                            return;
                        }
                        mutate(`/api/games/${slug}`);
                    }}
                >
                    <Delete />
                </IconButton>
            </Box>
        </ListItem>
    );
}

interface VariantsProps {
    gameData: Game;
}

export default function Variants({ gameData }: VariantsProps) {
    if (!gameData.difficultyVariantsEnabled || !gameData.difficultyVariants) {
        return null;
    }

    return (
        <>
            <Typography variant="h6">Difficulty Variants</Typography>
            <List>
                {gameData.difficultyVariants.map((variant) => (
                    <DifficultyVariantRow
                        key={variant.id}
                        slug={gameData.slug}
                        variant={variant}
                    />
                ))}
                <Formik
                    initialValues={{
                        name: '',
                        goalAmounts: Array(gameData.difficultyGroups).fill(0),
                    }}
                    onSubmit={async ({ name, goalAmounts }) => {
                        const res = await fetch(
                            `/api/games/${gameData.slug}/difficultyVariants`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name, goalAmounts }),
                            },
                        );

                        if (!res.ok) {
                            alertError(`Unable to save difficulty variant`);
                            return;
                        }
                        mutate(`/api/games/${gameData.slug}`);
                    }}
                    validateOnChange={false}
                >
                    {({ values, resetForm }) => (
                        <Form>
                            <Box
                                sx={{
                                    display: 'flex',
                                    columnGap: 1,
                                    alignItems: 'center',
                                }}
                            >
                                <FormikTextField name="name" label="Name" />
                                <FieldArray name="goalAmounts">
                                    {() =>
                                        values.goalAmounts?.map((_, index) => (
                                            <NumberInput
                                                key={index}
                                                name={`goalAmounts.${index}`}
                                                label={`${index + 1}`}
                                                min={0}
                                                max={25}
                                            />
                                        ))
                                    }
                                </FieldArray>
                                <IconButton
                                    edge="end"
                                    onClick={() => {
                                        resetForm();
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
                            </Box>
                        </Form>
                    )}
                </Formik>
            </List>
        </>
    );
}
