'use client';
import FormikTextField from '@/components/input/FormikTextField';
import NumberInput from '@/components/input/NumberInput';
import { alertError } from '@/lib/Utils';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import {
    Box,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItem,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { GoalCategory } from '@playbingo/types';
import { Form, Formik } from 'formik';
import { useState } from 'react';
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
            <Box
                sx={{
                    display: 'flex',
                }}
            >
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
                                    display: 'flex',
                                    alignItems: 'center',
                                    columnGap: 1,
                                }}
                            >
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

enum SortOptions {
    NAME,
    MAXIMUM,
}

const sortOptions = [
    { label: 'Name', value: SortOptions.NAME },
    { label: 'Maximum', value: SortOptions.MAXIMUM },
];
interface GoalCategoriesProps {
    slug: string;
    categories: GoalCategory[];
}

export default function GoalCategories({
    slug,
    categories,
}: GoalCategoriesProps) {
    const [sort, setSort] = useState<SortOptions>(SortOptions.NAME);
    const [reverse, setReverse] = useState(false);
    const [search, setSearch] = useState('');

    const shownCats = categories
        .filter((c) => {
            if (search && search.length > 0) {
                if (c.name.toLowerCase().includes(search.toLowerCase())) {
                    return true;
                }
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            switch (sort) {
                case SortOptions.NAME:
                    return a.name.localeCompare(b.name);
                case SortOptions.MAXIMUM:
                    return (a.max ?? 0) - (b.max ?? 0);
                default:
                    return 1;
            }
        });
    if (reverse) {
        shownCats.reverse();
    }

    return (
        <>
            <Box sx={{ display: 'flex', columnGap: 4 }}>
                <TextField
                    type="text"
                    label="Search"
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ width: '33%' }}
                />
                <Box
                    sx={{
                        display: 'flex',
                        width: '33%',
                        alignItems: 'center',
                        columnGap: 1,
                    }}
                >
                    <FormControl fullWidth>
                        <InputLabel id="filter-sort-by-label">
                            Sort by
                        </InputLabel>
                        <Select
                            id="filter-sort-by"
                            labelId="filter-sort-by-label"
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value as SortOptions);
                            }}
                            label="Sort by"
                        >
                            {sortOptions.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Tooltip title="Toggle sort direction">
                        <IconButton onClick={() => setReverse((curr) => !curr)}>
                            {reverse ? <ArrowUpward /> : <ArrowDownward />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <List>
                {shownCats.map((cat) => (
                    <CategoryForm key={cat.id} cat={cat} slug={slug} />
                ))}
            </List>
        </>
    );
}
