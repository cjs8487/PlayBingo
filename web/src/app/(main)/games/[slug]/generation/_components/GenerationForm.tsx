'use client';
import { FormikSelectField } from '@/components/input/FormikSelectField';
import {
    JSONSchema,
    JsonSchemaRenderer,
    JSONValue,
} from '@/components/input/JsonSchemaRenderer';
import { alertError, notifyMessage } from '@/lib/Utils';
import { Add, Delete } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    FormHelperText,
    IconButton,
    Typography,
} from '@mui/material';
import { GeneratorConfigSchema } from '@playbingo/shared/GeneratorConfig';
import { Game, GeneratorSettings, GeneratorStep } from '@playbingo/types';
import { Form, Formik, useField } from 'formik';
import { useCallback, useMemo, useState } from 'react';
import * as z from 'zod';

type GeneratorConfigSingle = string;
type GeneratorConfigMultiple = string[];
interface StepProps {
    step: GeneratorStep;
}

function GenerationStepSingle({
    step: { value: name, displayName, description, availableRules },
}: StepProps) {
    const [, meta] = useField<GeneratorConfigSingle>(name);

    const options = useMemo(
        () =>
            availableRules.map((r) => ({
                label: r.displayName,
                value: r.value,
                tooltip: r.description,
            })),
        [availableRules],
    );

    const error = meta.touched && !!meta.error;

    return (
        <Card
            variant="outlined"
            component="fieldset"
            sx={{
                mb: 1,
                borderColor: error ? 'error.main' : 'divider',
                background: 'unset',
            }}
        >
            <Typography
                sx={{
                    px: 1,
                    color: error ? 'error.main' : '',
                }}
                component="legend"
            >
                {displayName}
            </Typography>
            <CardContent>
                <Typography variant="body2">{description}</Typography>
                {availableRules.length > 0 && (
                    <FormikSelectField
                        id={`${name}`}
                        name={`${name}`}
                        label=""
                        options={options}
                        sx={{ width: '100%', mt: 2 }}
                    />
                )}
            </CardContent>
        </Card>
    );
}
function GenerationStepMultiple({
    step: { value: name, displayName, description, availableRules },
}: StepProps) {
    const [{ value }, meta, { setValue }] =
        useField<GeneratorConfigMultiple>(name);

    const addNewValue = useCallback(() => {
        value.push('');
        setValue(value);
    }, [value, setValue]);

    const removeValue = useCallback(
        (index: number) => {
            value.splice(index, 1);
            setValue(value);
        },
        [value, setValue],
    );

    const options = useMemo(
        () =>
            availableRules.map((r) => ({
                label: r.displayName,
                value: r.value,
                tooltip: r.description,
            })),
        [availableRules],
    );

    const error =
        meta.touched &&
        (Array.isArray(meta.error) ? meta.error.length > 0 : !!meta.error);

    return (
        <Card
            variant="outlined"
            component="fieldset"
            sx={{
                mb: 1,
                borderColor: error ? 'error.main' : 'divider',
                background: 'unset',
            }}
        >
            <Typography
                sx={{
                    px: 1,
                    color: error ? 'error.main' : '',
                }}
                component="legend"
            >
                {displayName}
            </Typography>
            <CardContent>
                <Typography variant="body2">{description}</Typography>
                {error && !Array.isArray(meta.error) && (
                    <FormHelperText error={error}>{meta.error}</FormHelperText>
                )}
                {value.map((_, idx) => (
                    <Box
                        key={idx}
                        sx={{
                            display: 'flex',
                            columnGap: 0.5,
                            mt: 2,
                        }}
                    >
                        <FormikSelectField
                            id={`${name}-${idx}`}
                            name={`${name}[${idx}]`}
                            label=""
                            options={options}
                            sx={{ flexGrow: 1 }}
                        />
                        <IconButton onClick={() => removeValue(idx)}>
                            <Delete />
                        </IconButton>
                    </Box>
                ))}
                {availableRules.length > 0 && (
                    <Card
                        variant="outlined"
                        sx={{
                            borderStyle: 'dashed',
                            mt: 2,
                            background: 'unset',
                        }}
                    >
                        <CardActionArea onClick={addNewValue}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Add />
                                <Typography>Add new rule</Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                )}
            </CardContent>
        </Card>
    );
}

interface Props {
    game: Game;
}

const schemaJson = z.toJSONSchema(GeneratorConfigSchema);

export default function GenerationPage({ game }: Props) {
    const [config, setConfig] = useState<JSONValue>({});

    return (
        <div>
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
        </div>
    );

    return (
        <Formik
            initialValues={game.generationSettings}
            onSubmit={async (values) => {
                const res = await fetch(`/api/games/${game.slug}/generation`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(values),
                });
                if (!res.ok) {
                    alertError(
                        `Failed to save generator options - ${await res.text()}`,
                    );
                    return;
                }

                notifyMessage('Successfully updated generation settings');
            }}
            validate={(values) => {
                const errors: { [k: string]: string | string[] } = {};
                steps.forEach((s) => {
                    if (s.required) {
                        if (
                            (s.selectMultiple &&
                                values[s.value as keyof GeneratorSettings]
                                    .length === 0) ||
                            (!s.selectMultiple &&
                                !values[s.value as keyof GeneratorSettings])
                        ) {
                            errors[s.value] = `${s.displayName} is required.`;
                        }
                    }

                    if (s.selectMultiple) {
                        const valList = values[
                            s.value as keyof GeneratorSettings
                        ] as string[];
                        if (valList.length > 0) {
                            errors[s.value] = [];
                            valList.forEach((v, idx) => {
                                if (valList.indexOf(v) !== idx) {
                                    (errors[s.value] as string[])[idx] =
                                        'Duplicate values are not allowed.';
                                }
                            });

                            if (errors[s.value].length === 0) {
                                delete errors[s.value];
                            }
                        }
                    }
                });
                return errors;
            }}
        >
            {({ resetForm }) => (
                <Form>
                    {steps.map((step) =>
                        step.selectMultiple ? (
                            <GenerationStepMultiple
                                key={step.value}
                                step={step}
                            />
                        ) : (
                            <GenerationStepSingle
                                key={step.value}
                                step={step}
                            />
                        ),
                    )}
                </Form>
            )}
        </Formik>
    );
}
