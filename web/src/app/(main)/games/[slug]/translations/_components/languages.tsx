'use client';
import { Box, IconButton, List, ListItem, TextField } from '@mui/material';
import { useState } from 'react';
import { Form, Formik } from 'formik';
import { alertError } from '@/lib/Utils';
import FormikTextField from '@/components/input/FormikTextField';
import { Add, Check, Close, Delete, Edit } from '@mui/icons-material';
import { deleteLanguage } from '@/actions/Game';

interface LanguagesProps {
    slug: string;
    languages: string[];
}

interface LanguageFormProps {
    slug: string;
    language: string;
    onDelete: (lang: string) => void;
}

function LanguageForm({ language, slug, onDelete }: LanguageFormProps) {
    const [edit, setEdit] = useState(false);
    if (language === 'New Language') {
        setEdit(true);
    }
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
                    initialValues={{ language }}
                    onSubmit={async (newVal) => {
                        const res = await fetch(
                            `/api/games/${slug}/translations`,
                            {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    translations: [
                                        { old: language, new: newVal.language },
                                    ],
                                }),
                            },
                        );

                        if (!res.ok) {
                            return alertError('Failed to update language');
                        }
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
                                    name="language"
                                    id={`${language.toLowerCase()}-language`}
                                    label="Language"
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
                                {edit && language !== 'New Language' && (
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
                                        const res = await deleteLanguage(
                                            slug,
                                            language,
                                        );

                                        if (!res.ok) {
                                            alertError(
                                                `Unable to delete language`,
                                            );
                                            return;
                                        }
                                        onDelete(language);
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        </Form>
                    )}
                </Formik>
            </Box>
        </ListItem>
    );
}

export default function Languages({
    slug,
    languages: initialLanguages,
}: LanguagesProps) {
    const [newLang, setNewLang] = useState('');
    const [languages, setLanguages] = useState<string[]>(initialLanguages);

    const shownLanguages = languages.sort((a, b) => a.localeCompare(b));

    const handleAddLang = async () => {
        if (!newLang.trim()) return alertError('Please enter a new language');

        const res = await fetch(`/api/games/${slug}/translations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ translations: [newLang] }),
        });

        if (!res.ok) return alertError('Failed to add language');
        setLanguages((prev) =>
            [...prev, newLang.trim()].sort((a, b) => a.localeCompare(b)),
        );
        setNewLang('');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                width: '100%',
                flexDirection: 'column',
                maxHeight: '100%',
            }}
        >
            <List
                sx={{
                    maxHeight: '100%',
                    overflowY: 'auto',
                    width: '100%',
                }}
            >
                {shownLanguages.map((lang) => (
                    <LanguageForm
                        key={lang}
                        language={lang}
                        slug={slug}
                        onDelete={(lang) => {
                            setLanguages((prev) =>
                                prev.filter((l) => lang !== l),
                            );
                        }}
                    ></LanguageForm>
                ))}
            </List>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    columnGap: 1,
                    mt: 2,
                    width: '33%',
                }}
            >
                <TextField
                    label="New Language"
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    fullWidth
                    size="small"
                />
                <IconButton
                    color="primary"
                    onClick={handleAddLang}
                    disabled={!newLang.trim()}
                >
                    <Add />
                </IconButton>
            </Box>
        </Box>
    );
}
