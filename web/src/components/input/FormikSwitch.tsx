import {
    FormControlLabel,
    Switch,
    SxProps,
    Typography,
    TypographyProps,
} from '@mui/material';
import { useField } from 'formik';

interface FormikSwitchProps {
    id: string;
    name: string;
    label: string;
    sx?: SxProps;
    switchSx?: SxProps;
    labelProps?: TypographyProps;
}
export default function FormikSwitch({
    id,
    name,
    label,
    sx,
    switchSx,
    labelProps,
}: FormikSwitchProps) {
    const [field, , helpers] = useField<boolean>(name);

    return (
        <FormControlLabel
            control={
                <Switch
                    id={id}
                    checked={field.value}
                    onChange={(e) => helpers.setValue(e.target.checked)}
                    onBlur={field.onBlur}
                    sx={switchSx}
                />
            }
            label={<Typography {...labelProps}>{label}</Typography>}
            sx={sx}
        />
    );
}
