import Add from '@mui/icons-material/Add';
import {
    Button,
    Card,
    CardActionArea,
    CardContent,
    CircularProgress,
    FormControl,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    Tooltip,
    Typography,
} from '@mui/material';
import { GeneratorOptions, GeneratorStep } from '@playbingo/types';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';

interface StepProps {
    step: GeneratorStep;
}

function GenerationStep({
    step: {
        value,
        displayName,
        description,
        required,
        selectMultiple,
        availableRules,
    },
}: StepProps) {
    return (
        <Card variant="outlined" component="fieldset" sx={{ mb: 1 }}>
            <Typography
                sx={{
                    px: 1,
                }}
                component="legend"
            >
                {displayName}
            </Typography>
            <CardContent>
                <Typography variant="body2" sx={{ mb: 4 }}>
                    {description}
                </Typography>
                {!selectMultiple && (
                    <FormControl fullWidth>
                        <InputLabel>Value</InputLabel>
                        <Select label="Value">
                            {availableRules.map((rule) => (
                                <MenuItem key={rule.value} value={rule.value}>
                                    <Tooltip title={rule.description}>
                                        <ListItemText>
                                            {rule.displayName}
                                        </ListItemText>
                                    </Tooltip>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                {selectMultiple && (
                    <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
                        <CardActionArea>
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

    return (
        <Formik
            initialValues={{}}
            onSubmit={(values) => {
                console.log(values);
            }}
        >
            <Form>
                {steps.map((step) => (
                    <GenerationStep key={step.value} step={step} />
                ))}
                <Button type="submit">Save</Button>
            </Form>
        </Formik>
    );
}
