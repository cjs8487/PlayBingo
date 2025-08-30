'use client';
import Add from '@mui/icons-material/Add';
import Remove from '@mui/icons-material/Remove';
import Star from '@mui/icons-material/Star';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Cell } from '@playbingo/types';
import { useCallback, useContext, useState } from 'react';
import { RoomContext } from '../../context/RoomContext';
import TextFit from '../TextFit';

interface CellProps {
    cell: Cell;
    row: number;
    col: number;
}

export default function BoardCell({
    cell: { goal, colors },
    row,
    col,
}: CellProps) {
    // context
    const {
        color,
        markGoal,
        unmarkGoal,
        starredGoals,
        toggleGoalStar,
        showGoalDetails,
        showCounters,
    } = useContext(RoomContext);

    // callbacks
    const toggleSpace = useCallback(() => {
        if (colors.includes(color)) {
            unmarkGoal(row, col);
        } else {
            markGoal(row, col);
        }
    }, [row, col, markGoal, unmarkGoal, color, colors]);

    // calculations
    const colorPortion = 360 / colors.length;
    const isStarred = starredGoals.includes(row * 5 + col);

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
