'use client';
import Add from '@mui/icons-material/Add';
import Remove from '@mui/icons-material/Remove';
import Star from '@mui/icons-material/Star';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import {
    Cell,
    RevealedCell as CellRevealed,
    HiddenCell as CellHidden,
} from '@playbingo/types';
import { useCallback, useContext, useState } from 'react';
import { RoomContext } from '../../context/RoomContext';
import TextFit from '../TextFit';

interface CellProps {
    cell: Cell;
    row: number;
    col: number;
}

export default function BoardCell({ cell, row, col }: CellProps) {
    if (cell.revealed) {
        return <RevealedCell cell={cell} row={row} col={col} />;
    }
    return <HiddenCell cell={cell} row={row} col={col} />;
}

interface HiddenCellProps {
    cell: CellHidden;
    row: number;
    col: number;
}

function HiddenCell({ cell: { completedPlayers }, row, col }: HiddenCellProps) {
    const { starredGoals, colorMap } = useContext(RoomContext);

    // calculations
    const colorPortion = 360 / completedPlayers.length;
    const isStarred = starredGoals.includes(row * 5 + col);
    const colors = completedPlayers
        .map((player) => colorMap[player])
        .filter((c) => !!c);

    return (
        <Box
            sx={{
                position: 'relative',
                aspectRatio: '1 / 1',
                flexGrow: 1,
                cursor: 'default',
                overflow: 'hidden',
                border: 1,
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                background: (theme) => theme.palette.background.default,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(145deg, rgba(30,30,40,0.85) 0%, rgba(15,15,25,0.9) 60%, rgba(10,10,20,0.95) 100%), radial-gradient(circle at 40% 30%, rgba(100,120,255,0.08) 0%, rgba(0,0,0,0) 80%)`,
                    mixBlendMode: 'lighten',
                    backdropFilter: 'blur(6px) brightness(0.8)',
                    WebkitBackdropFilter: 'blur(6px) brightness(0.8)',
                    animation: 'fogMove 12s ease-in-out infinite',
                    '&::after': {
                        content: "''",
                        position: 'absolute',
                        inset: 0,
                        background:
                            'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.6) 100%)',
                        pointerEvents: 'none',
                    },
                    '@keyframes fogMove': {
                        '0%': { transform: 'translate(0, 0)' },
                        '50%': { transform: 'translate(-10px, 8px)' },
                        '100%': { transform: 'translate(0, 0)' },
                    },
                }}
            />
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
            {isStarred && (
                <Box
                    sx={{ position: 'absolute', right: 2, top: 2, zIndex: 11 }}
                >
                    <Star fontSize="small" />
                </Box>
            )}
        </Box>
    );
}

interface RevealedCellProps {
    cell: CellRevealed;
    row: number;
    col: number;
}

function RevealedCell({
    cell: { goal, completedPlayers },
    row,
    col,
}: RevealedCellProps) {
    // context
    const {
        markGoal,
        unmarkGoal,
        starredGoals,
        toggleGoalStar,
        showGoalDetails,
        showCounters,
        connectedPlayer,
        colorMap,
    } = useContext(RoomContext);

    // callbacks
    const toggleSpace = useCallback(() => {
        if (!connectedPlayer) {
            return;
        }
        if (connectedPlayer.spectator) {
            return;
        }
        if (completedPlayers.includes(connectedPlayer.id)) {
            unmarkGoal(row, col);
        } else {
            markGoal(row, col);
        }
    }, [row, col, markGoal, unmarkGoal, connectedPlayer, completedPlayers]);

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

    return (
        <Tooltip
            title={
                showGoalDetails ? (
                    <>
                        <Box sx={{ pb: 1.5 }}>{goal.description}</Box>
                        {goal.difficulty && (
                            <Box>Difficulty: {goal.difficulty}</Box>
                        )}
                        {goal.categories && (
                            <Box>Categories: {goal.categories.join(', ')}</Box>
                        )}
                    </>
                ) : (
                    goal.description
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
                    cursor: 'pointer',
                    overflow: 'hidden',
                    border: 1,
                    borderColor: 'divider',
                    transition: 'all',
                    transitionDuration: 300,
                    background: (theme) => theme.palette.background.default,
                    ':hover': {
                        zIndex: 10,
                        scale: '110%',
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                        // position: 'absolute',
                        zIndex: 10,
                        display: 'flex',
                        height: '100%',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 1,
                    }}
                >
                    <TextFit
                        text={goal.goal}
                        sx={{
                            p: 1,
                            filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0))',
                        }}
                    />
                </Box>
                {colors.map((color, index) => (
                    <Box
                        key={color}
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
                {showCounters && (
                    <Box
                        sx={{
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
            </Box>
        </Tooltip>
    );
}
