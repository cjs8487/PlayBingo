'use client';
import { Box, Button, Popover } from '@mui/material';
import {
    EditableInput,
    EditableInputRGBA,
    hexToHsva,
    HsvaColor,
    hsvaToHex,
    Hue,
    Saturation,
    Swatch,
} from '@uiw/react-color';
import PopupState, { bindPopover, bindTrigger } from 'material-ui-popup-state';
import { useContext, useState } from 'react';
import { useLocalStorage } from 'react-use';
import { RoomContext } from '../../context/RoomContext';

export default function ColorSelect() {
    const { color, changeColor } = useContext(RoomContext);

    const colors = ['#0000ff', '#ff0000', '#ffa500', '#008000', '#800080'];

    const [newColor, setNewColor] = useState<HsvaColor>(
        hexToHsva(color.startsWith('#') ? color : '#0000ff'),
    );

    const [storedCustomColor, setStoredCustomColor] = useLocalStorage(
        'PlayBingo.customcolor',
        '',
    );

    const [customColor, setCustomColor] = useState(storedCustomColor ?? '');

    return (
        <PopupState variant="popover">
            {(popupState) => (
                <>
                    <Button
                        {...bindTrigger(popupState)}
                        sx={{
                            gap: 1,
                            color,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Box
                            sx={{
                                borderRadius: '100%',
                                width: 20,
                                height: 20,
                                aspectRatio: '1 / 1',
                                background: color,
                            }}
                        />
                        Change Color
                    </Button>
                    <Popover
                        {...bindPopover(popupState)}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        onClose={() => {
                            const newColorHex = hsvaToHex(newColor);
                            changeColor(newColorHex);
                            if (!colors.includes(newColorHex)) {
                                setStoredCustomColor(newColorHex);
                                setCustomColor(newColorHex);
                            }
                            popupState.close();
                        }}
                        sx={{
                            width: 250,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                py: 1,
                            }}
                        >
                            <Saturation
                                hsva={newColor}
                                onChange={(hsva) => {
                                    setNewColor(hsva);
                                }}
                                radius={12}
                            />
                            <Hue
                                hue={newColor.h}
                                onChange={(hue) => {
                                    setNewColor({ ...newColor, h: hue.h });
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
                                    value={hsvaToHex(newColor)}
                                    onChange={(e, value) => {
                                        setNewColor(hexToHsva(`${value}`));
                                    }}
                                    label="Hex"
                                    placement="bottom"
                                />
                                <EditableInputRGBA
                                    hsva={newColor}
                                    aProps={false}
                                    onChange={(color) =>
                                        setNewColor(color.hsva)
                                    }
                                />
                            </Box>
                            <Swatch
                                colors={[...colors, customColor]}
                                color={color}
                                onChange={(hsva) => {
                                    setNewColor(hsva);
                                    const newColorHex = hsvaToHex(hsva);
                                    if (!colors.includes(newColorHex)) {
                                        setCustomColor(newColorHex);
                                    }
                                }}
                            />
                        </Box>
                    </Popover>
                </>
            )}
        </PopupState>
    );
}
