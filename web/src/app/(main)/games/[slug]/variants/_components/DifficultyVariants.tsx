'use client';
import { Check, Close, Delete, Edit } from '@mui/icons-material';
import { Box, IconButton, List, ListItem, Typography } from '@mui/material';
import { DifficultyVariant } from '@playbingo/types';
import { FieldArray, Form, Formik } from 'formik';
import {} from 'mdi-material-ui';
import { useState } from 'react';
import { mutate } from 'swr';
import FormikTextField from '../../../../../../components/input/FormikTextField';
import NumberInput from '../../../../../../components/input/NumberInput';
import { alertError } from '../../../../../../lib/Utils';

interface DifficultyVariantEditRowProps {
    slug: string;
    variant: DifficultyVariant;
    disabled: boolean;
    done: () => void;
}

function DifficultyVariantEditRow({
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

interface DifficultyVariantRow {
    slug: string;
    variant: DifficultyVariant;
    moderator?: boolean;
}

function DifficultyVariantRow({
    slug,
    variant,
    moderator,
}: DifficultyVariantRow) {
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
                <DifficultyVariantEditRow
                    slug={slug}
                    variant={variant}
                    disabled={!edit}
                    done={() => setEdit(false)}
                />
                {!edit && moderator && (
                    <IconButton edge="end" onClick={() => setEdit(true)}>
                        <Edit />
                    </IconButton>
                )}
                {moderator && (
                    <IconButton
                        edge="end"
                        onClick={async () => {
                            const res = await fetch(
                                `/api/games/${slug}/difficultyVariants/${variant.id}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                },
                            );

                            if (!res.ok) {
                                alertError(
                                    `Unable to delete difficulty variant`,
                                );
                                return;
                            }
                            mutate(`/api/games/${slug}`);
                        }}
                    >
                        <Delete />
                    </IconButton>
                )}
            </Box>
        </ListItem>
    );
}

interface Props {
    slug: string;
    groups: number;
    variants: DifficultyVariant[];
    moderator?: boolean;
}

export default function DifficultyVariants({
    slug,
    groups,
    variants,
    moderator,
}: Props) {
    return (
        <>
            <Typography variant="h6">Difficulty Variants</Typography>
            <List>
                {variants.map((variant) => (
                    <DifficultyVariantRow
                        key={variant.id}
                        slug={slug}
                        variant={variant}
                        moderator={moderator}
                    />
                ))}
                {moderator && (
                    <Formik
                        initialValues={{
                            name: '',
                            goalAmounts: Array(groups).fill(0),
                        }}
                        onSubmit={async ({ name, goalAmounts }) => {
                            const res = await fetch(
                                `/api/games/${slug}/difficultyVariants`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ name, goalAmounts }),
                                },
                            );

                            if (!res.ok) {
                                alertError(`Unable to save difficulty variant`);
                                return;
                            }
                            mutate(`/api/games/${slug}`);
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
                                            values.goalAmounts?.map(
                                                (_, index) => (
                                                    <NumberInput
                                                        key={index}
                                                        name={`goalAmounts.${index}`}
                                                        label={`${index + 1}`}
                                                        min={0}
                                                        max={25}
                                                    />
                                                ),
                                            )
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
                )}
            </List>
        </>
    );
}
