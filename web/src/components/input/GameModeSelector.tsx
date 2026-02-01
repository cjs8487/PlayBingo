'use client';
import {
    Box,
    Button,
    Typography,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { useField, useFormikContext } from 'formik';
import { useState } from 'react';

interface GameMode {
    id: string;
    name: string;
    description: string;
    detailedDescription?: string;
    icon?: string;
}

const gameModes: GameMode[] = [
    {
        id: 'BINGO',
        name: 'Bingo',
        description: 'Complete lines, patterns, or full card',
        detailedDescription:
            'Traditional bingo gameplay with customizable win conditions. Complete horizontal lines, vertical lines, diagonal lines, or specific patterns to win.',
        icon: '🎯',
    },
    {
        id: 'BLACKOUT',
        name: 'Blackout',
        description: 'Cover the entire card to win',
        detailedDescription:
            'Complete blackout mode where all squares must be marked to achieve victory. This mode typically takes longer and offers a different strategic challenge.',
        icon: '⚫',
    },
];

function BingoModeConfig() {
    const { values, setFieldValue } = useFormikContext<Record<string, any>>();

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'white' }}>
                Win Configuration
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['1 Line', '2 Lines', '3 Lines', '4 Lines', '5 Lines'].map(
                    (lines) => (
                        <Button
                            key={lines}
                            size="small"
                            variant={
                                values.winCondition === lines
                                    ? 'contained'
                                    : 'outlined'
                            }
                            onClick={() => setFieldValue('winCondition', lines)}
                            sx={{
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1,
                                bgcolor:
                                    values.winCondition === lines
                                        ? 'rgba(255,255,255,0.2)'
                                        : 'rgba(255,255,255,0.1)',
                                borderColor: 'rgba(255,255,255,0.3)',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.3)',
                                },
                            }}
                        >
                            {lines}
                        </Button>
                    ),
                )}
            </Box>
        </Box>
    );
}

function BlackoutModeConfig() {
    const { values, setFieldValue } = useFormikContext<Record<string, any>>();

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'white' }}>
                Blackout Settings
            </Typography>

            <FormControlLabel
                control={
                    <Switch
                        checked={values.lockoutMode || false}
                        onChange={(e) =>
                            setFieldValue('lockoutMode', e.target.checked)
                        }
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: 'white',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                                {
                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                },
                        }}
                    />
                }
                label={
                    <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                        Lockout Mode
                    </Typography>
                }
                sx={{ mb: 2 }}
            />

            <Typography
                variant="body2"
                sx={{ fontSize: '0.8rem', opacity: 0.8, mb: 1 }}
            >
                {values.lockoutMode
                    ? 'Lockout enabled: Only one player can claim each goal. First to majority wins!'
                    : 'Standard blackout: All players mark goals independently. First to complete wins.'}
            </Typography>
        </Box>
    );
}

function GameModeButton({
    mode,
    isSelected,
    onClick,
}: {
    mode: GameMode;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <Box
            sx={{
                flex: isSelected ? 1 : 0,
                transition: 'flex 0.3s ease-in-out',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                minWidth: '45px',
            }}
        >
            <Box
                onClick={onClick}
                sx={{
                    height: '100%',
                    py: 2,
                    px: 3,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    bgcolor: isSelected
                        ? 'secondary.light'
                        : 'background.paper',
                    borderColor: isSelected ? 'secondary.main' : 'divider',
                    '&:hover': isSelected
                        ? {}
                        : {
                              bgcolor: 'action.hover',
                              transform: 'translateY(-2px)',
                          },
                    minWidth: 0,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    cursor: isSelected ? 'default' : 'pointer',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        rotate: isSelected ? 0 : '90deg',
                        transformOrigin: 'center left',
                        gap: 1,
                        mb: 1,
                        textAlign: 'center',
                        color: 'text.primary',
                        transition: 'all 0.3s ease-in-out',
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: isSelected ? '1.5rem' : '1.2rem',
                        }}
                    >
                        {mode.icon}
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: isSelected ? '1.1rem' : '0.9rem',
                            fontWeight: isSelected ? 600 : 500,
                        }}
                    >
                        {mode.name}
                    </Typography>
                </Box>
                {isSelected && (
                    <>
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    mb: 1,
                                    opacity: 0,
                                    animation:
                                        '0.5s ease-in-out 0.2s forwards slidein',
                                }}
                            >
                                {mode.description}
                            </Typography>
                            {mode.detailedDescription && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        fontSize: '0.8rem',
                                        lineHeight: 1.4,
                                        opacity: 0,
                                        animation:
                                            '0.5s ease-in-out 0.3s forwards slidein',
                                    }}
                                >
                                    {mode.detailedDescription}
                                </Typography>
                            )}
                        </Box>
                        <Box
                            sx={{
                                mt: 2,
                                p: 2,
                                bgcolor: 'rgba(255,255,255,0.1)',
                                borderRadius: 1,
                                border: '1px solid rgba(255,255,255,0.2)',
                                width: '100%',
                                opacity: 0,
                                animation:
                                    '0.5s ease-in-out 0.4s forwards slidein',
                            }}
                        >
                            {mode.id === 'BINGO' && <BingoModeConfig />}
                            {mode.id === 'BLACKOUT' && <BlackoutModeConfig />}
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}

export default function GameModeSelector() {
    const [field] = useField('gameMode');
    const { setFieldValue } = useFormikContext();
    const [selectedMode, setSelectedMode] = useState(
        field.value || gameModes[0].id,
    );

    const handleModeSelect = (modeId: string) => {
        setSelectedMode(modeId);
        setFieldValue('gameMode', modeId);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
                minHeight: 320,
                height: 320,
            }}
        >
            {gameModes.map((mode) => (
                <GameModeButton
                    key={mode.id}
                    mode={mode}
                    isSelected={selectedMode === mode.id}
                    onClick={() => handleModeSelect(mode.id)}
                />
            ))}
        </Box>
    );
}
