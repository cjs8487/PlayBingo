import { Add, Remove } from '@mui/icons-material';
import {
    IconButton,
    InputAdornment,
    TextField,
    TextFieldPropsSizeOverrides,
} from '@mui/material';
import { OverridableStringUnion } from '@mui/types';
import { useField } from 'formik';
import { useCallback } from 'react';

interface NumberInputProps {
    id?: string;
    name: string;
    label: string;
    min?: number;
    max?: number;
    disabled?: boolean;
    required?: boolean;
    size?: OverridableStringUnion<
        'small' | 'medium',
        TextFieldPropsSizeOverrides
    >;
}

/**
 * Custom Formik input field for working with numbers. Allows specifying the
 * minimum and maximum number in the field, and ensures that the value is
 * between them (inclusive) on every change. Provides step buttons for inline
 * mouse control of the field value.
 *
 * The provided inline validation should not be relied upon for form level
 * validation. If the value needs to be validated, it should still be validated
 * like any other form element
 */
export default function NumberInput({
    id,
    name,
    label,
    min,
    max,
    disabled,
    required,
    size,
}: NumberInputProps) {
    const [{ value: val }, meta, helpers] = useField<number | ''>(name);
    const value = val === '' ? 0 : val;
    const setValue = useCallback(
        (v: number) => {
            if (required && Number.isNaN(v)) return;
            if (!required && v !== undefined && Number.isNaN(v)) return;
            if (min !== undefined && v < min) return;
            if (max !== undefined && v > max) return;
            helpers.setValue(Number(v));
        },
        [min, max, helpers, required],
    );
    const decrement = useCallback(() => {
        setValue((value ?? 0) - 1);
    }, [value, setValue]);
    const increment = useCallback(() => {
        setValue((value ?? 0) + 1);
    }, [value, setValue]);

    return (
        <TextField
            id={id}
            label={label}
            inputMode="numeric"
            value={val}
            disabled={disabled}
            onChange={(e) => {
                if (e.target.value === '') {
                    helpers.setValue('');
                } else {
                    setValue(Number(e.target.value));
                }
            }}
            sx={{ p: 0 }}
            size={size}
            slotProps={{
                input: {
                    slotProps: {
                        root: { style: { padding: 0 } },
                    },
                    startAdornment: (
                        <InputAdornment position="start" sx={{ m: 0 }}>
                            <IconButton
                                type="button"
                                onClick={decrement}
                                disabled={
                                    disabled ||
                                    (min !== undefined ? value <= min : false)
                                }
                                sx={{
                                    minWidth: 0,
                                    p: 0.5,
                                    m: 0.5,
                                }}
                            >
                                <Remove />
                            </IconButton>
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end" sx={{ m: 0 }}>
                            <IconButton
                                type="button"
                                onClick={increment}
                                disabled={
                                    disabled ||
                                    (max !== undefined ? value >= max : false)
                                }
                                sx={{
                                    minWidth: 0,
                                    p: 0.5,
                                    m: 0.5,
                                }}
                            >
                                <Add />
                            </IconButton>
                        </InputAdornment>
                    ),
                },

                htmlInput: {
                    pattern: '[0-9]*',
                },
            }}
            error={meta.touched && !!meta.error}
            helperText={meta.touched && meta.error}
        />
    );
}
