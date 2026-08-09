import { Palette } from '@mui/icons-material';
import {
    Box,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
} from '@mui/material';
import {
    EditableInput,
    EditableInputRGBA,
    hexToHsva,
    hsvaToHex,
    Hue,
    Saturation,
} from '@uiw/react-color';
import { useField } from 'formik';
import { useRef, useState } from 'react';
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
                    <Paper
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            p: 1,
                        }}
                    >
                        <Saturation
                            hsva={hexToHsva(value)}
                            onChange={(hsva) => {
                                setValue(hsvaToHex(hsva));
                            }}
                            radius={12}
                        />
                        <Hue
                            hue={hexToHsva(value).h}
                            onChange={(hue) => {
                                setValue(
                                    hsvaToHex({
                                        ...hexToHsva(value),
                                        h: hue.h,
                                    }),
                                );
                            }}
                            width={'90%'}
                            radius={12}
                        />
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                px: 1,
                            }}
                        >
                            <EditableInput
                                value={value}
                                onChange={(e, value) => {
                                    setValue(`${value}`);
                                }}
                                label="Hex"
                                placement="bottom"
                            />
                            <EditableInputRGBA
                                hsva={hexToHsva(value)}
                                aProps={false}
                                onChange={(color) => setValue(color.hex)}
                            />
                        </Box>
                    </Paper>
                </Box>
            )}
        </Box>
    );
}
