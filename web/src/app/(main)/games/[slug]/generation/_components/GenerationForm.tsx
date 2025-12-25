'use client';
import {
    JSONSchema,
    JsonSchemaRenderer,
    useJSONForm,
} from '@/components/input/JsonSchemaRenderer';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { GeneratorSettings, makeGeneratorSchema } from '@playbingo/shared';
import { Goal, GoalCategory, GoalTag } from '@playbingo/types';
import { useCallback } from 'react';
import * as z from 'zod';
import { alertError, notifyMessage } from '../../../../../../lib/Utils';
import CustomLayoutEditor, {
    CustomLayout,
    Schema,
} from '../../../../../../components/generation/CustomLayoutEditor';

interface Props {
    slug: string;
    categories: GoalCategory[];
    goals: Goal[];
    initialValues?: GeneratorSettings;
    tags: GoalTag[];
}

export default function GenerationForm({
    slug,
    categories,
    goals,
    initialValues,
    tags,
}: Props) {
    const { schema, metadata } = makeGeneratorSchema(categories, goals, tags);
    const schemaJson = z.toJSONSchema(schema, { metadata });

    const { values, setValues, errors, isValid, handleSubmit } = useJSONForm(
        schema,
        initialValues ?? {
            goalFilters: [],
            goalTransformation: [],
            boardLayout: { mode: 'random' },
            restrictions: [],
            adjustments: [],
        },
    );

    const submitForm = useCallback(() => {
        handleSubmit(async (config) => {
            const res = await fetch(`/api/games/${slug}/generation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        <Box sx={{ width: '100%' }}>
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
                components={{
                    'boardLayout.layout': ({
                        schema,
                        value,
                        onChange,
                        errors,
                        path,
                        components,
                    }) => {
                        return (
                            <CustomLayoutEditor
                                schema={schema as Schema}
                                value={value as CustomLayout}
                                onChange={onChange}
                                errors={errors}
                                path={path}
                                components={components}
                            />
                        );
                    },
                }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button color="error" onClick={() => setValues({})}>
                    Cancel
                </Button>
                <Tooltip
                    title={
                        errors
                            ? `Resolve ${Object.keys(errors).length} error(s) to save changes`
                            : ''
                    }
                    placement="top"
                    arrow
                    slotProps={{
                        popper: {
                            modifiers: [
                                {
                                    name: 'offset',
                                    options: {
                                        offset: [0, -10],
                                    },
                                },
                            ],
                        },
                    }}
                >
                    {/* simple wrapper required due to disabled buttons not firing any events */}
                    <span>
                        <Button
                            type="submit"
                            color="success"
                            disabled={!isValid}
                            onClick={submitForm}
                        >
                            Save
                        </Button>
                    </span>
                </Tooltip>
            </Box>
        </Box>
    );
}
