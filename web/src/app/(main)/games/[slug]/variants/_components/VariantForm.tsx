'use client';
import { Box, Button, Typography } from '@mui/material';
import { makeGeneratorSchema } from '@playbingo/shared';
import { GoalCategory } from '@playbingo/types';
import { Form, Formik } from 'formik';
import { useCallback } from 'react';
import z from 'zod';
import FormikTextField from '../../../../../../components/input/FormikTextField';
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
            const res = await fetch(`/api/games/${slug}/generation`, {
                method: 'POST',
                headers: { Conten_type: 'application/json' },
                body: JSON.stringify(config),
            });

            if (!res.ok) {
                alertError(`Failed to save changes - ${await res.text()}`);
            } else {
                notifyMessage('Successfully updated generator configuration');
            }
        });
    }, [handleSubmit, slug]);

    const topError = errors[''];

    return (
        <>
            <Formik initialValues={{}} onSubmit={() => {}}>
                <Box
                    component={Form}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        mb: 4,
                    }}
                >
                    <FormikTextField name="name" label="Variant Name" />
                    <FormikTextField
                        name="description"
                        label="Description"
                        multiline
                        rows={4}
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
            </Formik>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button color="error">Cancel</Button>
                <Button color="success">Save</Button>
            </Box>
        </>
    );
}
