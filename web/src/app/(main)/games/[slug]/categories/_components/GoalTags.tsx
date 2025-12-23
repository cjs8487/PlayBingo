'use client';
import FormikTextField from '@/components/input/FormikTextField';
import { alertError } from '@/lib/Utils';
import { Save } from '@mui/icons-material';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import {
    Box,
    IconButton,
    List,
    ListItem,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { GoalCategory } from '@playbingo/types';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import { mutate } from 'swr';
import { deleteTag } from '../../../../../../actions/Game';

interface TagFormProps {
    tag: GoalCategory;
    slug: string;
}

function TagForm({ tag, slug }: TagFormProps) {
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
                    initialValues={{ name: tag.name, max: tag.max }}
                    onSubmit={async (values) => {
                        const res = await fetch(
                            `/api/games/${slug}/tags/${tag.id}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(values),
                            },
                        );

                        if (!res.ok) {
                            return alertError('Failed to update goal tag');
                        }
                        mutate(`/api/games/${slug}/tags`);
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
                                    id={`tag-${tag.id}-name`}
                                    label="Name"
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
                                        const res = await deleteTag(
                                            slug,
                                            tag.id,
                                        );

                                        if (!res.ok) {
                                            alertError(`Unable to delete tag`);
                                            return;
                                        }
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                                <Typography>{tag.goalCount} goals</Typography>
                            </Box>
                        </Form>
                    )}
                </Formik>
            </Box>
        </ListItem>
    );
}

interface GoalTagsProps {
    slug: string;
    tags: GoalCategory[];
}

export default function GoalTags({ slug, tags: tags }: GoalTagsProps) {
    const [reverse, setReverse] = useState(false);
    const [search, setSearch] = useState('');

    const shownTags = tags
        .filter((c) => {
            if (search && search.length > 0) {
                if (c.name.toLowerCase().includes(search.toLowerCase())) {
                    return true;
                }
                return false;
            }
            return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    if (reverse) {
        shownTags.reverse();
    }

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                maxHeight: '100%',
            }}
        >
            <Box sx={{ display: 'flex', columnGap: 1 }}>
                <TextField
                    type="text"
                    label="Search"
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ width: '33%' }}
                />
                <Tooltip title="Toggle sort direction">
                    <IconButton onClick={() => setReverse((curr) => !curr)}>
                        {reverse ? <ArrowUpward /> : <ArrowDownward />}
                    </IconButton>
                </Tooltip>
            </Box>
            <List sx={{ maxHeight: '100%', overflowY: 'auto' }}>
                {shownTags.map((tag) => (
                    <TagForm key={tag.id} tag={tag} slug={slug} />
                ))}
                <ListItem>
                    <Box
                        sx={{
                            display: 'flex',
                        }}
                    >
                        <Formik
                            initialValues={{ name: '' }}
                            onSubmit={async (values) => {
                                const res = await fetch(
                                    `/api/games/${slug}/tags/`,
                                    {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify(values),
                                    },
                                );

                                if (!res.ok) {
                                    return alertError(
                                        'Failed to create goal tag',
                                    );
                                }
                                mutate(`/api/games/${slug}/tags`);
                            }}
                        >
                            {({ resetForm }) => (
                                <Form>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            columnGap: 0.5,
                                        }}
                                    >
                                        <FormikTextField
                                            name="name"
                                            id={`new-tag-name`}
                                            label="Name"
                                        />
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
                                            <Save />
                                        </IconButton>
                                    </Box>
                                </Form>
                            )}
                        </Formik>
                    </Box>
                </ListItem>
            </List>
        </Box>
    );
}
