import { Palette } from '@mui/icons-material';
import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import { useField } from 'formik';
import { useCallback, useRef, useState } from 'react';
import { ColorResult, SketchPicker } from 'react-color';
import { useClickAway } from 'react-use';

interface Props {
    name: string;
    label: string;
    size?: 'small' | 'medium';
}

export default function FormikColorSelect({ name, label, size }: Props) {
    const [{ value }, { touched, error }, { setValue }] = useField<string>({
        name,
    });

    const [picker, setPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const changeColor = useCallback(
        (color: ColorResult) => {
            setValue(color.hex);
        },
        [setValue],
    );

    useClickAway(pickerRef, () => {
        setPicker(false);
    });

    return (
        <Box sx={{ position: 'relative', overflow: 'visible' }}>
            <TextField
                name={name}
                label={label}
                value={value}
                error={touched && !!error}
                helperText={touched && error}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <Box
                                    sx={{
                                        width:
                                            size === 'small' ? '24px' : '32px',
                                        height:
                                            size === 'small' ? '24px' : '32px',
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        backgroundColor: value,
                                    }}
                                />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setPicker(true)}>
                                    <Palette />
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
                size={size}
            />

            {picker && (
                <Box
                    ref={pickerRef}
                    sx={{
                        position: 'absolute',
                        zIndex: 20,
                        bottom: '100%',
                        left: '50%',
                        transform: 'translate(-50%, 0)',
                        overflowY: 'visible',
                    }}
                >
                    <SketchPicker color={value} onChange={changeColor} />
                </Box>
            )}
        </Box>
    );
}
