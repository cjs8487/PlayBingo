'use client';
import { Box } from '@mui/material';
import { useContext, useRef, useState } from 'react';
import { SketchPicker } from 'react-color';
import { useClickAway, useLocalStorage } from 'react-use';
import { RoomContext } from '../../context/RoomContext';

export default function ColorSelect() {
    const { color, changeColor } = useContext(RoomContext);

    const colors = ['blue', 'red', 'orange', 'green', 'purple'];

    const [storedCustomColor, setStoredCustomColor] = useLocalStorage(
        'PlayBingo.customcolor',
        '',
    );

    const [customColor, setCustomColor] = useState(storedCustomColor ?? '');
    const [picker, setPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useClickAway(pickerRef, () => {
        setPicker(false);
        changeColor(customColor);
    });

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                columnGap: 2,
                rowGap: 1,
            }}
        >
            {colors.map((colorItem) => (
                <Box
                    key={colorItem}
                    onClick={() => changeColor(colorItem)}
                    sx={{
                        bgcolor: colorItem,
                        backgroundColor: colorItem,
                        cursor: 'pointer',
                        border: color === colorItem ? 4 : 0,
                        borderColor: 'white',
                        px: 1,
                        py: 0.5,

                        ':hover': {
                            scale: '110%',
                        },
                    }}
                >
                    {colorItem}
                </Box>
            ))}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box
                    sx={{
                        backgroundColor: customColor,
                        cursor: 'pointer',
                        border: color === customColor ? 4 : 0,
                        borderColor: 'white',
                        px: 1,
                        py: 0.5,
                        ':hover': {
                            scale: '110%',
                        },
                    }}
                    onClick={() => setPicker(true)}
                >
                    custom
                </Box>
                {picker && (
                    <Box
                        ref={pickerRef}
                        sx={{
                            position: 'absolute',
                            zIndex: 20,
                        }}
                    >
                        <SketchPicker
                            color={customColor}
                            onChange={(color) => {
                                setStoredCustomColor(color.hex);
                                setCustomColor(color.hex);
                            }}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
