import Add from '@mui/icons-material/Add';
import {
    Button,
    Card,
    CardActionArea,
    CardContent,
    CircularProgress,
    FormControl,
    FormHelperText,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    Tooltip,
    Typography,
} from '@mui/material';
import { GeneratorOptions, GeneratorStep } from '@playbingo/types';
import { Form, Formik, useField, useFormik } from 'formik';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormikSelectField } from '../../../../components/input/FormikSelectField';

type GeneratorConfigSingle = string;
type GeneratorConfigMultiple = string[];
interface StepProps {
    step: GeneratorStep;
}

function GenerationStepSingle({
    step: { value: name, displayName, description, required, availableRules },
}: StepProps) {
    const [{}, meta] = useField<GeneratorConfigSingle>(name);

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
                borderColor: (theme) =>
                    error ? theme.palette.error.main : theme.palette.divider,
            }}
        >
            <Typography
                sx={{
                    px: 1,
                    color: (theme) => (error ? theme.palette.error.main : ''),
                }}
                component="legend"
            >
                {displayName}
            </Typography>
            <CardContent>
                <Typography variant="body2" sx={{ mb: 4 }}>
                    {description}
                </Typography>
                <FormikSelectField
                    id={`${name}`}
                    name={`${name}`}
                    label=""
                    options={options}
                    sx={{ width: '100%', mb: 2 }}
                />
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
                borderColor: (theme) =>
                    error ? theme.palette.error.main : theme.palette.divider,
            }}
        >
            <Typography
                sx={{
                    px: 1,
                    color: (theme) => (error ? theme.palette.error.main : ''),
                }}
                component="legend"
            >
                {displayName}
            </Typography>
            <CardContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    {description}
                </Typography>
                {error && !Array.isArray(meta.error) && (
                    <FormHelperText error={error}>{meta.error}</FormHelperText>
                )}
                {value.map((v, idx) => (
                    <FormikSelectField
                        id={`${name}-${idx}`}
                        name={`${name}[${idx}]`}
                        label=""
                        options={availableRules.map((r) => ({
                            label: r.displayName,
                            value: r.value,
                            tooltip: r.description,
                        }))}
                        sx={{ width: '100%', mb: 2 }}
                    />
                ))}
                {availableRules.length > 0 && (
                    <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
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

export default function GenerationPage() {
    const [generatorOptions, setGeneratorOptions] =
        useState<GeneratorOptions>();
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        async function load() {
            const res = await fetch(`/api/config/generator`);
            if (res.ok) {
                const options = await res.json();
                setGeneratorOptions(options);
            } else {
                setFailed(true);
            }
        }
        load();
    }, []);

    if (!generatorOptions) {
        if (!failed) {
            return <CircularProgress />;
        } else {
            return (
                <Typography>
                    Failed to load generator options from server.
                </Typography>
            );
        }
    }

    const { steps } = generatorOptions;

    const initialValues: { [k: string]: string | string[] } = {};
    generatorOptions.steps.forEach((s) => {
        if (s.selectMultiple) {
            initialValues[s.value] = [];
        } else {
            initialValues[s.value] = '';
        }
    });

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={(values) => {
                console.log(values);
            }}
            validate={(values) => {
                const errors: { [k: string]: string | string[] } = {};
                steps.forEach((s) => {
                    if (s.required) {
                        if (
                            (s.selectMultiple &&
                                values[s.value].length === 0) ||
                            (!s.selectMultiple && !values[s.value])
                        ) {
                            errors[s.value] = `${s.displayName} is required.`;
                        }
                    }

                    if (s.selectMultiple) {
                        const valList = values[s.value] as string[];
                        if (valList.length > 0) {
                            errors[s.value] = [];
                            valList.forEach((v, idx) => {
                                if (valList.indexOf(v) !== idx) {
                                    (errors[s.value] as string[])[idx] =
                                        'Duplicate values are not allowed.';
                                }
                            });
                        }
                    }
                });
                return errors;
            }}
        >
            <Form>
                {steps.map((step) =>
                    step.selectMultiple ? (
                        <GenerationStepMultiple key={step.value} step={step} />
                    ) : (
                        <GenerationStepSingle key={step.value} step={step} />
                    ),
                )}
                <Button type="submit">Save</Button>
            </Form>
        </Formik>
    );
}
