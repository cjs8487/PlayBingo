'use client';
import {
    Box,
    Chip,
    IconButton,
    SxProps,
    Tooltip,
    Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import TextFit from '../TextFit';
import Star from '@mui/icons-material/Star';
import { useRoomContext } from '../../context/RoomContext';
import { Add, Remove } from '@mui/icons-material';
import { Category } from '@playbingo/types';
import { Goal } from '@playbingo/types';
import Image from 'next/image';
import { getMediaForWorkflow } from '../../lib/Utils';

const fogSx: SxProps = {
    position: 'absolute',
    inset: 0,
    zIndex: 90,
    background: `
linear-gradient(125deg, rgba(0,0,0,0) 0%, rgba(161, 151, 151, 0.69) 10%, rgba(15, 15, 15, 0.57) 60%, rgba(93, 87, 87, 0.47) 90%, rgba(10,10,20,0.95) 100%),
radial-gradient(circle at 40% 30%, rgba(147, 137, 137, 0.13) 0%, rgba(0,0,0,0) 95%)
`,
    mixBlendMode: 'lighten',
    backdropFilter: 'blur(6px) brightness(0.8)',
    WebkitBackdropFilter: 'blur(6px) brightness(0.8)',
    '::after': {
        content: "''",
        position: 'absolute',
        inset: 0,
        background:
            'radial-gradient(ellipse at center, rgba(105, 105, 105, 0.15) 0%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
    },
};
interface BoardCellProps {
    goal?: Goal;
    completedPlayers: string[];
    revealed?: boolean;
    onReveal?: () => void;
    row: number;
    col: number;
}

export default function BoardCell({
    goal,
    completedPlayers,
    revealed = false,
    onReveal,
    row,
    col,
}: BoardCellProps) {
    const {
        markGoal,
        unmarkGoal,
        starredGoals,
        toggleGoalStar,
        showGoalDetails,
        showCounters,
        connectedPlayer,
        colorMap,
        showImages,
    } = useRoomContext();

    const [wasRevealed, setWasRevealed] = useState(false);
    const [animating, setAnimating] = useState(false);

    const toggleSpace = useCallback(() => {
        if (!connectedPlayer) {
            return;
        }
        if (connectedPlayer.spectator) {
            return;
        }
        if (!revealed) {
            return;
        }
        if (completedPlayers.includes(connectedPlayer.id)) {
            unmarkGoal(row, col);
        } else {
            markGoal(row, col);
        }
    }, [
        connectedPlayer,
        revealed,
        completedPlayers,
        unmarkGoal,
        row,
        col,
        markGoal,
    ]);

    useEffect(() => {
        if (revealed && !wasRevealed) {
            setWasRevealed(true);
            setAnimating(true);
            const timer = setTimeout(() => {
                setAnimating(false);
                if (onReveal) onReveal();
            }, 1000);
            return () => {
                clearTimeout(timer);
            };
        }
    }, [revealed, wasRevealed, onReveal]);

    // calculations
    const colorPortion = 360 / completedPlayers.length;
    const isStarred = starredGoals.includes(row * 5 + col);
    const colors = completedPlayers
        .map((player) => colorMap[player])
        .filter((c) => !!c);

    const [counter, setCounter] = useState(0);
    const updateProgress = useCallback((delta: number) => {
        setCounter((prev) => {
            const next = Math.max(0, prev + delta);
            return next;
        });
    }, []);

    console.log(goal);

    return (
        <Tooltip
            title={
                showGoalDetails ? (
                    <>
                        {showImages && goal?.image && (
                            <Box
                                sx={{
                                    pb: 1,
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                }}
                            >
                                {goal?.goal}
                            </Box>
                        )}
                        <Box sx={{ pb: 1.5 }}>{goal?.description}</Box>
                        {goal?.difficulty && (
                            <Box>Difficulty: {goal.difficulty}</Box>
                        )}
                        {goal?.categories && (
                            <Box>
                                Categories:{' '}
                                {goal.categories.map((c) => c.name).join(', ')}
                            </Box>
                        )}
                    </>
                ) : (
                    <>
                        {showImages && goal?.image && (
                            <Box
                                sx={{
                                    pb: 1,
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                }}
                            >
                                {goal?.goal}
                            </Box>
                        )}
                        <Box>{goal?.description}</Box>
                    </>
                )
            }
            arrow
            slotProps={{
                popper: {
                    modifiers: [
                        {
                            name: 'offset',
                            options: {
                                offset: [0, -14],
                            },
                        },
                    ],
                },
            }}
            enterDelay={1000}
        >
            <Box
                sx={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    flexGrow: 1,
                    cursor: revealed ? 'pointer' : 'default',
                    overflow: 'hidden',
                    border: 1,
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    background: (theme) => theme.palette.background.default,
                    ':hover': {
                        zIndex: 100,
                        scale: revealed ? '110%' : '100%',
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                }}
                onClick={toggleSpace}
                onContextMenu={(e) => {
                    toggleGoalStar(row, col);
                    e.preventDefault();
                }}
                onWheel={(e) => {
                    updateProgress(e.deltaY < 0 ? +1 : -1);
                }}
            >
                <Box
                    sx={{
                        zIndex: 2,
                        display: 'flex',
                        height: showCounters ? 'calc(100% - 24px)' : '100%',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 1,
                    }}
                >
                    {showImages && goal && goal.image ? (
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <Box
                                sx={{
                                    p: 2,
                                    width: '100%',
                                    height: '100%',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                    }}
                                >
                                    <Image
                                        src={getMediaForWorkflow(
                                            'goalImage',
                                            goal.image.mediaFile,
                                        )}
                                        alt=""
                                        fill
                                        style={{
                                            objectFit: 'contain',
                                        }}
                                    />
                                </Box>
                            </Box>
                            {goal.secondaryImage && (
                                <Image
                                    src={getMediaForWorkflow(
                                        'goalImage',
                                        goal.secondaryImage.mediaFile,
                                    )}
                                    alt=""
                                    width={25}
                                    height={25}
                                    style={{
                                        objectFit: 'contain',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                    }}
                                />
                            )}
                            {goal.imageTag && (
                                <Chip
                                    label={goal.imageTag.label}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        backgroundColor: goal.imageTag.color,
                                        opacity: 0.9,
                                    }}
                                    size="small"
                                />
                            )}
                            {goal.count && (
                                <Typography
                                    sx={{
                                        position: 'absolute',
                                        bottom: -8,
                                        right: 0,
                                        filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0))',
                                        textShadow: '2px 2px black',
                                    }}
                                    fontSize={24}
                                >
                                    {goal.count}
                                </Typography>
                            )}
                        </Box>
                    ) : (
                        <TextFit
                            text={goal?.goal ?? ''}
                            sx={{
                                p: 1,
                                filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0))',
                            }}
                        />
                    )}
                </Box>
                {colors.map((color, index) => (
                    <Box
                        key={`${color}-${index}`}
                        sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                        }}
                        style={{
                            backgroundImage: `conic-gradient(from ${
                                colorPortion * index
                            }deg, ${color} 0deg, ${color} ${colorPortion}deg, rgba(0,0,0,0) ${colorPortion}deg)`,
                        }}
                    />
                ))}
                {revealed && showCounters && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            display: 'flex',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            px: 0.5,
                            width: '100%',
                            zIndex: 30,
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                updateProgress(-1);
                                e.stopPropagation();
                            }}
                            sx={{ padding: 0.25 }}
                        >
                            <Remove fontSize="small" />
                        </IconButton>
                        <Typography
                            sx={{
                                textAlign: 'center',
                                color: 'white',
                                pointerEvents: 'none',
                                flexGrow: 1,
                            }}
                        >
                            {counter}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                updateProgress(+1);
                                e.stopPropagation();
                            }}
                            sx={{ padding: 0.25 }}
                        >
                            <Add fontSize="small" />
                        </IconButton>
                    </Box>
                )}
                {isStarred && (
                    <Box sx={{ position: 'absolute', right: 0 }}>
                        <Star />
                    </Box>
                )}
                {!revealed && <Box sx={fogSx} />}
                {animating && (
                    <Box
                        sx={{
                            ...fogSx,
                            animation: 'fogReveal 1s ease-in forwards',
                        }}
                    />
                )}
            </Box>
        </Tooltip>
    );
}
