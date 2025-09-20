'use client';
import {
    JSONSchema,
    JsonSchemaRenderer,
    JSONValue,
} from '@/components/input/JsonSchemaRenderer';
import { Box, Button } from '@mui/material';
import { makeGeneratorSchema } from '@playbingo/shared/GeneratorConfig';
import { GoalCategory } from '@playbingo/types';
import { useState } from 'react';
import * as z from 'zod';

interface Props {
    categories: GoalCategory[];
}

export default function GenerationPage({ categories }: Props) {
    const { schema, enumLabels } = makeGeneratorSchema(categories);
    const schemaJson = z.toJSONSchema(schema);

    const [config, setConfig] = useState<JSONValue>();

    return (
        <Box sx={{ width: '100%' }}>
            <JsonSchemaRenderer
                schema={schemaJson as JSONSchema}
                value={config}
                onChange={setConfig}
                labels={{
                    listMode: 'Goal List Mode',
                    boardLayout: 'Board Layout',
                    goalSelection: 'Goal Selection',
                    restrictions: 'Restrictions',
                    adjustments: 'Global Adjustments',
                    include: 'Include Categories',
                    exclude: 'Exclude Categories',
                    min: 'Min Difficulty',
                    max: 'Max Difficulty',
                }}
                optionLabels={{
                    all: 'All Goals',
                    'difficulty-filter': 'Difficulty Filter',
                    'category-filter': 'Category Filter',
                    ...enumLabels,
                }}
            />
            <pre>{JSON.stringify(config, null, 2)}</pre>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button color="error" onClick={() => setConfig({})}>
                    Cancel
                </Button>
                <Button type="submit" color="success">
                    Save
                </Button>
            </Box>
        </Box>
    );
}
