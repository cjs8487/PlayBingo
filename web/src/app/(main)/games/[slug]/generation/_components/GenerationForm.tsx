'use client';
import {
    JSONSchema,
    JsonSchemaRenderer,
    useJSONForm,
} from '@/components/input/JsonSchemaRenderer';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { makeGeneratorSchema } from '@playbingo/shared/GeneratorConfig';
import { GoalCategory } from '@playbingo/types';
import * as z from 'zod';

interface Props {
    categories: GoalCategory[];
}

export default function GenerationPage({ categories }: Props) {
    const { schema, metadata } = makeGeneratorSchema(categories);
    const schemaJson = z.toJSONSchema(schema, { metadata });

    const { values, setValues, errors, isValid } = useJSONForm(schema, {
        goalFilters: [],
        goalTransformation: 'none',
        boardLayout: 'random',
        goalSelection: 'random',
        restrictions: [],
        adjustments: [],
    });

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
            />
            <pre>{JSON.stringify(values, null, 2)}</pre>
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
                        >
                            Save
                        </Button>
                    </span>
                </Tooltip>
            </Box>
        </Box>
    );
}
