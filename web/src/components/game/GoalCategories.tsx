import { Box, IconButton, List, ListItem, Typography } from '@mui/material';
import { useApi } from '../../lib/Hooks';
import { Game } from '../../types/Game';
import { GoalCategory } from '../../types/GoalCategory';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import FormikTextField from '../input/FormikTextField';
import NumberInput from '../input/NumberInput';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import { alertError } from '../../lib/Utils';
import { mutate } from 'swr';

interface CategoryFormProps {
    cat: GoalCategory;
    slug: string;
}

function CategoryForm({ cat, slug }: CategoryFormProps) {
    const [edit, setEdit] = useState(false);
    return (
        <ListItem
            sx={{
                borderBottom: 1,
                borderColor: (theme) => theme.palette.divider,
            }}
        >
            <Box sx={{
                display: "flex"
            }}>
                <Formik
                    initialValues={{ name: cat.name, max: cat.max }}
                    onSubmit={async (values) => {
                        const res = await fetch(
                            `/api/goals/categories/${cat.id}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(values),
                            },
                        );

                        if (!res.ok) {
                            return alertError('Failed to update goal category');
                        }
                        mutate(`/api/games/${slug}/categories`);
                        setEdit(false);
                    }}
                >
                    {({ resetForm }) => (
                        <Form>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    columnGap: 1
                                }}>
                                <FormikTextField
                                    name="name"
                                    id={`cat-${cat.id}-name`}
                                    label="Name"
                                    disabled={!edit}
                                />
                                <NumberInput
                                    name="max"
                                    label="Max"
                                    disabled={!edit}
                                />

                                {!edit && (
                                    <IconButton
                                        edge="end"
                                        onClick={() => setEdit(true)}
                                    >
                                        <Edit />
                                    </IconButton>
                                )}
                                {edit && (
                                    <>
                                        <IconButton
                                            edge="end"
                                            onClick={() => {
                                                resetForm();
                                                setEdit(false);
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
                                <IconButton
                                    edge="end"
                                    onClick={async () => {
                                        const res = await fetch(
                                            `/api/goals/categories/${cat.id}`,
                                            {
                                                method: 'DELETE',
                                                headers: {
                                                    'Content-Type':
                                                        'application/json',
                                                },
                                            },
                                        );

                                        if (!res.ok) {
                                            alertError(
                                                `Unable to delete category`,
                                            );
                                            return;
                                        }
                                        mutate(`/api/games/${slug}/categories`);
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                                <Typography>{cat.goalCount} goals</Typography>
                            </Box>
                        </Form>
                    )}
                </Formik>
            </Box>
        </ListItem>
    );
}

interface GoalCategoriesProps {
    gameData: Game;
}

export default function GoalCategories({ gameData }: GoalCategoriesProps) {
    const {
        data: categories,
        isLoading,
        error,
        mutate,
    } = useApi<GoalCategory[]>(`/api/games/${gameData.slug}/categories`);

    if (!categories || isLoading) {
        return null;
    }

    if (error) {
        return (
            <Typography>Failed to load goal categories - {error}</Typography>
        );
    }
    return (
        <>
            <List>
                {categories.map((cat) => (
                    <CategoryForm key={cat.id} cat={cat} slug={gameData.slug} />
                ))}
            </List>
        </>
    );
}
