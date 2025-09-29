'use client';
import {
    Box,
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import { makeGeneratorSchema } from '@playbingo/shared';
import { GoalCategory } from '@playbingo/types';
import { useCallback, useState } from 'react';
import z from 'zod';
import {
    JSONSchema,
    JsonSchemaRenderer,
    useJSONForm,
} from '../../../../../../components/input/JsonSchemaRenderer';
import { alertError, notifyMessage } from '../../../../../../lib/Utils';

interface Props {
    slug: string;
    categories: GoalCategory[];
}

export default function VariantForm({ slug, categories }: Props) {
    const { schema, metadata } = makeGeneratorSchema(categories);
    const schemaJson = z.toJSONSchema(schema, { metadata });

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);

    const { values, setValues, errors, isValid, handleSubmit } = useJSONForm(
        schema,
        {
            goalFilters: [],
            goalTransformation: 'none',
            boardLayout: 'random',
            goalSelection: 'random',
            restrictions: [],
            adjustments: [],
        },
    );

    const submitForm = useCallback(() => {
        handleSubmit(async (config) => {
            if (name.trim().length === 0) {
                setNameError('Name is required');
                return;
            }

            const res = await fetch(`/api/games/${slug}/variants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    config,
                }),
            });
            if (!res.ok) {
                alertError('Unable to create variant.');
                return;
            }
            notifyMessage('Variant created.');
            // Close the dialog
            window.location.reload();
        });
    }, [handleSubmit, slug, name, description]);

    const topError = errors[''];

    return (
        <>
            <DialogTitle>Add New Variant</DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        mb: 4,
                        mt: 1,
                    }}
                >
                    <TextField
                        label="Variant Name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (e.target.value.trim().length === 0) {
                                setNameError('Name is required');
                            } else {
                                setNameError(null);
                            }
                        }}
                        error={!!nameError}
                        helperText={nameError}
                        required
                    />
                    <TextField
                        label="Description"
                        multiline
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    {topError && (
                        <Typography sx={{ color: 'error.main', mb: 2 }}>
                            {topError}
                        </Typography>
                    )}
                    <JsonSchemaRenderer
                        schema={schemaJson as JSONSchema}
                        value={values}
                        onChange={setValues}
                        errors={errors}
                        path=""
                    />
                </Box>
            </DialogContent>
            <DialogActions
                sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}
            >
                <Button color="error">Cancel</Button>
                <Button
                    color="success"
                    onClick={submitForm}
                    disabled={!isValid}
                >
                    Save
                </Button>
            </DialogActions>
        </>
    );
}
