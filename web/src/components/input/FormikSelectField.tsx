import {
    Autocomplete,
    FormControl,
    FormHelperText,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    SxProps,
    TextField,
    Tooltip,
} from '@mui/material';
import { useField } from 'formik';

interface SelectOption {
    label: string;
    value: string;
    tooltip?: string;
}
interface FormikSelectProps {
    id: string;
    name: string;
    label: string;
    options: SelectOption[];
    placeholder?: string;
    sx?: SxProps;
}

export function FormikSelectField({
    id,
    name,
    label,
    options,
    sx,
}: FormikSelectProps) {
    const [field, meta, helpers] = useField<string | null>(name);

    const error = meta.touched && !!meta.error;

    return (
        <FormControl sx={sx}>
            <InputLabel id={`${id}-label`} error={error}>
                {label}
            </InputLabel>
            <Select
                id={id}
                name={name}
                label={label}
                value={field.value}
                onChange={(e) => {
                    helpers.setValue(e.target.value);
                }}
                onBlur={field.onBlur}
                error={meta.touched && !!meta.error}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.tooltip ? (
                            <Tooltip title={option.tooltip}>
                                <ListItemText>{option.label}</ListItemText>
                            </Tooltip>
                        ) : (
                            option.label
                        )}
                    </MenuItem>
                ))}
            </Select>
            {error && (
                <FormHelperText error={error}>{meta.error}</FormHelperText>
            )}
        </FormControl>
    );
}

export function FormikSelectFieldAutocomplete({
    id,
    name,
    label,
    options,
}: FormikSelectProps) {
    const [field, meta, helpers] = useField<string | null>(name);

    return (
        <Autocomplete
            id={id}
            value={
                options.find((opt) => opt.value === field.value)?.label ?? null
            }
            onChange={(_, newValue) => {
                helpers.setValue(
                    options.find((option) => option.label === newValue)
                        ?.value ?? null,
                );
            }}
            onBlur={field.onBlur}
            blurOnSelect
            clearOnBlur
            options={options.map((option) => option.label)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    name={name}
                    label={label}
                    onBlur={field.onBlur}
                    error={meta.touched && !!meta.error}
                    helperText={meta.touched && meta.error}
                />
            )}
        />
    );
}
