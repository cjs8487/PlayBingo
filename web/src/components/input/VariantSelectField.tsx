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
import { useAsync } from 'react-use';

/**
 * Self-contained variant select component for use in Formik managed forms.
 */
export default function VariantSelectField(
    props: Omit<FormControlProps, 'value'>,
) {
    const {
        values: { game },
    } = useFormikContext<{ game: string }>();
    const [field, meta] = useField<string>('variant');

    const error = meta.touched && !!meta.error;

    const options = useAsync(async () => {
        if (!game) {
            return [];
        }

        const res = await fetch(`/api/games/${game}`);
        if (!res.ok) {
            return [];
        }
        const gameData: Game = await res.json();
        return [
            ...(gameData.difficultyVariants ?? []),
            ...(gameData.variants ?? []),
        ];
    }, [game]);

    const disabled = !options.value || options.value.length === 0;

    return (
        <FormControl {...props}>
            <InputLabel id="variant-label">Variant</InputLabel>
            <Select
                id="variant"
                labelId="variant-label"
                name="variant"
                value={field.value}
                onBlur={field.onBlur}
                onChange={field.onChange}
                fullWidth
                label="Variant"
                disabled={disabled}
            >
                {options.value?.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                        {option.name}
                    </MenuItem>
                ))}
            </Select>
            {error && (
                <FormHelperText error={error}>{meta.error}</FormHelperText>
            )}
            {disabled && (
                <FormHelperText>
                    {options.loading
                        ? 'Loading variants...'
                        : 'No variants available'}
                </FormHelperText>
            )}
        </FormControl>
    );
}
