'use client';
import { Box, Tooltip } from '@mui/material';
import { useCallback, useContext } from 'react';
import { RoomContext } from '../../context/RoomContext';
import { Cell } from '@playbingo/types';
import TextFit from '../TextFit';
import Star from '@mui/icons-material/Star';

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
    const { color, markGoal, unmarkGoal, starredGoals, toggleGoalStar } =
        useContext(RoomContext);

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

    return (
        <Tooltip
            title={goal.description}
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
                }}
                onClick={toggleSpace}
                onContextMenu={(e) => {
                    toggleGoalStar(row, col);
                    e.preventDefault();
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
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
                {isStarred && (
                    <Box sx={{ position: 'absolute', right: 0 }}>
                        <Star />
                    </Box>
                )}
            </Box>
        </Tooltip>
    );
}
