'use client';
import {
    Description,
    Switch as HeroSwitch,
    Label,
    Radio,
    RadioGroup,
    Slider,
    Surface,
    ToggleButton,
    ToggleButtonGroup,
} from '@heroui/react';
import {
    Box,
    Button,
    ButtonGroup,
    FormControlLabel,
    Switch,
    Typography,
    useTheme,
} from '@mui/material';
import clsx from 'clsx';
import { useField, useFormikContext } from 'formik';
import { useState } from 'react';
import { RoomFormValues } from '../RoomCreateForm';
import { Lock } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

interface GameMode {
    id: string;
    name: string;
    description: string;
    detailedDescription?: string;
    icon?: string;
}

const gameModes: GameMode[] = [
    {
        id: 'LINES',
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

interface StandardBingoWinCondition {
    name: string;
    lineCount: number;
}

const winConditions: StandardBingoWinCondition[] = [
    {
        name: 'Single Bingo',
        lineCount: 1,
    },
    {
        name: 'Double Bingo',
        lineCount: 2,
    },
    {
        name: 'Triple Bingo',
        lineCount: 3,
    },
    {
        name: 'Quad Bingo',
        lineCount: 4,
    },
    {
        name: 'Cinco Bingo',
        lineCount: 5,
    },
];

function BingoModeConfig() {
    const { values, setFieldValue } = useFormikContext<RoomFormValues>();

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'white' }}>
                Win Condition
            </Typography>
            <ButtonGroup
                size="small"
                color="secondary"
                sx={{ flexWrap: 'wrap' }}
            >
                {winConditions.map((condition) => (
                    <Button
                        key={condition.name}
                        variant={
                            values.lineCount === condition.lineCount
                                ? 'contained'
                                : 'outlined'
                        }
                        onClick={() =>
                            setFieldValue('lineCount', condition.lineCount)
                        }
                        sx={{
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1,
                            color: 'white',
                        }}
                    >
                        {condition.name}
                    </Button>
                ))}
            </ButtonGroup>
        </Box>
    );
}

function BlackoutModeConfig() {
    const { values, setFieldValue, handleBlur } =
        useFormikContext<RoomFormValues>();

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'white' }}>
                Blackout Settings
            </Typography>
            <FormControlLabel
                control={
                    <Switch
                        checked={values.mode === 'LOCKOUT'}
                        onChange={(e) =>
                            setFieldValue(
                                'mode',
                                e.target.checked ? 'LOCKOUT' : 'BLACKOUT',
                            )
                        }
                        onBlur={handleBlur}
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
                label={<Typography>Lockout</Typography>}
                sx={{
                    color: 'white',
                    fontSize: '0.9rem',
                }}
            />
            <Typography
                variant="caption"
                sx={{ opacity: 0.8, mb: 1, display: 'block' }}
            >
                {values.mode === 'LOCKOUT'
                    ? 'Lockout enabled: Only one player can claim each goal. First to majority wins! Best played with exactly 2 players.'
                    : 'Standard blackout: First player to complete all the goals on the board wins!'}
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
                            {mode.id === 'LINES' && <BingoModeConfig />}
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

    const theme = useTheme();

    const handleModeSelect = (modeId: string) => {
        setSelectedMode(modeId);
        setFieldValue('mode', modeId);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
                [theme.breakpoints.only('xs')]: {
                    minHeight: 450,
                    height: 450,
                },
                [theme.breakpoints.up('sm')]: {
                    minHeight: 350,
                    height: 350,
                },
                [theme.breakpoints.up('md')]: {
                    minHeight: 300,
                    height: 300,
                },
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

export function GameModeSelectorHero() {
    return (
        <RadioGroup orientation="horizontal" name="gameMode">
            <div className="width-full xs:h-112.5 flex gap-4 sm:h-87.5 md:h-75">
                {gameModes.map((mode) => (
                    <HeroGameModeButton key={mode.id} mode={mode} />
                ))}
            </div>
        </RadioGroup>
    );
}

function HeroGameModeButton({ mode }: { mode: GameMode }) {
    return (
        <Radio value={mode.id}>
            {({ isSelected, isFocusVisible }) => (
                <Radio.Content
                    className={clsx(
                        'group bg-surface h-full min-w-11 rounded-(--radius) border p-6 text-left',
                        'transition-all duration-300 ease-in-out',
                        isSelected ? 'flex-1' : 'flex-0',
                        isSelected && 'border-accent bg-accent/10',
                        isFocusVisible && 'border-accent bg-accent/10',
                    )}
                >
                    <div
                        className={clsx(
                            'flex origin-left items-center justify-start gap-2 pb-2 text-center transition-all duration-300 ease-in-out',
                            isSelected ? 'rotate-0' : 'rotate-90',
                        )}
                    >
                        {mode.icon}
                        <Label className="text-lg">{mode.name}</Label>
                    </div>
                    <div>
                        <div
                            className={clsx(
                                'animate-[0.5s_ease-in-out_0.2s_forwards_slidein] opacity-0',
                                isSelected ? 'block' : 'hidden',
                            )}
                        >
                            <div>{mode.description}</div>
                            <div className="text-muted my-2 text-xs">
                                {mode.detailedDescription}
                            </div>
                        </div>
                        <Surface
                            className={clsx(
                                'rounded-(--radius) border p-4',
                                'animate-[0.5s_ease-in-out_0.3s_forwards_slidein] opacity-0',
                                isSelected ? 'block' : 'hidden',
                            )}
                        >
                            {mode.id === 'LINES' && (
                                <>
                                    <Slider
                                        minValue={1}
                                        maxValue={5}
                                        className="max-w-1/2"
                                    >
                                        <Label className="pb-2 text-sm font-bold">
                                            Win Condition
                                        </Label>
                                        <Slider.Output>
                                            {({ state: { values } }) => {
                                                if (values[0] === 1)
                                                    return 'Single Bingo (1 Line)';
                                                if (values[0] === 2)
                                                    return 'Double Bingo (2 Lines)';
                                                if (values[0] === 3)
                                                    return 'Triple Bingo (3 Lines)';
                                                if (values[0] === 4)
                                                    return 'Quad Bingo (4 Lines)';
                                                if (values[0] === 5)
                                                    return 'Cinco Bingo (5 Lines)';
                                                return '';
                                            }}
                                        </Slider.Output>
                                        <Slider.Track>
                                            <Slider.Fill />
                                            <Slider.Thumb name="lineCount" />
                                        </Slider.Track>
                                    </Slider>
                                </>
                            )}
                            {mode.id === 'BLACKOUT' && (
                                <>
                                    <div className="pb-2 text-sm font-bold">
                                        Blackout Settings
                                    </div>
                                    <HeroSwitch size="md" name="lockout">
                                        {({ isSelected }) => (
                                            <>
                                                <HeroSwitch.Control>
                                                    <HeroSwitch.Thumb>
                                                        <HeroSwitch.Icon>
                                                            {isSelected && (
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faLock
                                                                    }
                                                                    className="text-muted text-xs"
                                                                />
                                                            )}
                                                        </HeroSwitch.Icon>
                                                    </HeroSwitch.Thumb>
                                                </HeroSwitch.Control>
                                                <HeroSwitch.Content>
                                                    <Label>Lockout</Label>
                                                    <Description>
                                                        {isSelected
                                                            ? 'Lockout enabled: Only one player can claim each goal. First to a majority wins! Best played with exactly 2 players.'
                                                            : 'Standard blackout: First player to complete all the goals on the board wins!'}
                                                    </Description>
                                                </HeroSwitch.Content>
                                            </>
                                        )}
                                    </HeroSwitch>
                                </>
                            )}
                        </Surface>
                    </div>
                </Radio.Content>
            )}
        </Radio>
    );
}
