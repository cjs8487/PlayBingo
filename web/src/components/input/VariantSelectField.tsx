import {
    FormControl,
    FormControlProps,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import { Game } from '@playbingo/types';
import { useField, useFormikContext } from 'formik';
import useSWR from 'swr';
import type { RoomFormValues } from '../RoomCreateForm';

/**
 * Self-contained variant select component for use in Formik managed forms.
 */
export default function VariantSelectField(
    props: Omit<FormControlProps, 'value'>,
) {
    const {
        values: { game },
        setValues,
    } = useFormikContext<RoomFormValues>();
    const [field, meta] = useField<string>('variant');

    const error = meta.touched && !!meta.error;

    const {
        data,
        isLoading,
        error: loadError,
    } = useSWR<Game>(
        game ? `/api/games/${encodeURIComponent(game)}` : null,
        async (url: string) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Unable to load variants');
            return res.json();
        },
    );
    const options = [
        ...(data?.difficultyVariants ?? []),
        ...(data?.variants ?? []),
    ];

    const disabled = options.length === 0;

    return (
        <FormControl {...props}>
            <InputLabel id="variant-label">Variant</InputLabel>
            <Select
                id="variant"
                labelId="variant-label"
                name="variant"
                value={field.value}
                onBlur={field.onBlur}
                onChange={(event) => {
                    const variant = event.target.value;
                    setValues((values) => ({
                        ...values,
                        variant,
                        boardSizes: [],
                    }));
                }}
                fullWidth
                label="Variant"
                disabled={disabled}
            >
                <MenuItem value="">Normal</MenuItem>
                {options.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                        {option.name}
                    </MenuItem>
                ))}
            </Select>
            {error && (
                <FormHelperText error={error}>{meta.error}</FormHelperText>
            )}
            {game && disabled && (
                <FormHelperText>
                    {isLoading
                        ? 'Loading variants...'
                        : loadError
                          ? 'Unable to load variants'
                          : 'No variants available'}
                </FormHelperText>
            )}
        </FormControl>
    );
}
