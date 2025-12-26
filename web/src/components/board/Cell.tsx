'use client';
import { Add, Remove } from '@mui/icons-material';
import Star from '@mui/icons-material/Star';
import {
    Box,
    ClickAwayListener,
    Grow,
    IconButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    SxProps,
    Tooltip,
    Typography,
} from '@mui/material';
import { Category } from '@playbingo/types';
import { MouseLeftClickOutline, MouseRightClickOutline } from 'mdi-material-ui';
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '../../context/RoomContext';
import TextFit from '../TextFit';

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
    goal?: string;
    description?: string | null;
    difficulty?: number;
    categories?: Category[];
    completedPlayers: string[];
    revealed?: boolean;
    onReveal?: () => void;
    row: number;
    col: number;
}

export default function BoardCell({
    goal = '',
    description,
    difficulty,
    categories,
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
    } = useRoomContext();

    const [wasRevealed, setWasRevealed] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
    } | null>(null);

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

    const cellRef = useRef<HTMLDivElement>(null);

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

    const handleClose = () => {
        setContextMenu(null);
    };

    const handleListKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Tab') {
            event.preventDefault();
            setContextMenu(null);
        } else if (event.key === 'Escape') {
            setContextMenu(null);
        }
    };

    const handleCellClick = (e: MouseEvent<HTMLDivElement>) => {
        setContextMenu(null);

        if (e.button === 0) {
            // left click
            if (e.ctrlKey) {
                if (e.shiftKey) {
                    updateProgress(-1);
                } else {
                    updateProgress(1);
                }
            } else {
                toggleSpace();
            }
        } else if (e.button === 2) {
            // right click
            if (e.ctrlKey) {
                toggleGoalStar(row, col);
            } else {
                setContextMenu(
                    contextMenu === null
                        ? {
                              mouseX: e.clientX + 2,
                              mouseY: e.clientY - 6,
                          }
                        : null,
                );
            }
        }
    };

    return (
        <>
            <Tooltip
                title={
                    showGoalDetails ? (
                        <>
                            <Box sx={{ pb: 1.5 }}>{description}</Box>
                            {difficulty && <Box>Difficulty: {difficulty}</Box>}
                            {categories && (
                                <Box>
                                    Categories:{' '}
                                    {categories.map((c) => c.name).join(', ')}
                                </Box>
                            )}
                        </>
                    ) : (
                        description
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
                        hidden: contextMenu !== null,
                    },
                }}
                enterDelay={1000}
            >
                <Box
                    id={`cell-${row}-${col}`}
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
                    onMouseDown={handleCellClick}
                    onContextMenu={(e) => {
                        e.preventDefault();
                    }}
                    onWheel={(e) => {
                        updateProgress(e.deltaY < 0 ? +1 : -1);
                    }}
                    ref={cellRef}
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
                        <TextFit
                            text={goal}
                            sx={{
                                p: 1,
                                filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0))',
                            }}
                        />
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
            <Popper
                open={contextMenu !== null}
                anchorEl={cellRef.current}
                role={undefined}
                placement="bottom-start"
                transition
                disablePortal
                sx={{ zIndex: 1000 }}
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom-start'
                                    ? 'left top'
                                    : 'left bottom',
                        }}
                    >
                        <Paper sx={{ maxWidth: '100%' }}>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList
                                    autoFocusItem={contextMenu !== null}
                                    id="composition-menu"
                                    aria-labelledby={`cell-${row}-${col}`}
                                    onKeyDown={handleListKeyDown}
                                    dense
                                >
                                    <MenuItem
                                        onClick={() => {
                                            toggleGoalStar(row, col);
                                            handleClose();
                                        }}
                                        divider
                                    >
                                        <ListItemIcon>
                                            <Star />
                                        </ListItemIcon>
                                        <ListItemText
                                            sx={{
                                                textAlign: 'left',
                                            }}
                                        >
                                            Star
                                        </ListItemText>
                                        <ListItemText>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'text.secondary',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-end',
                                                    ml: 4,
                                                }}
                                            >
                                                Ctrl+
                                                <MouseRightClickOutline />
                                            </Typography>
                                        </ListItemText>
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            updateProgress(1);
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Add />
                                        </ListItemIcon>
                                        <ListItemText
                                            sx={{
                                                textAlign: 'left',
                                            }}
                                        >
                                            Increment
                                        </ListItemText>
                                        <ListItemText>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'text.secondary',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-end',
                                                    ml: 4,
                                                }}
                                            >
                                                Ctrl+
                                                <MouseLeftClickOutline />
                                            </Typography>
                                        </ListItemText>
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            updateProgress(-1);
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Remove />
                                        </ListItemIcon>
                                        <ListItemText
                                            sx={{
                                                textAlign: 'left',
                                            }}
                                        >
                                            Decrement
                                        </ListItemText>
                                        <ListItemText>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'text.secondary',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-end',
                                                    ml: 4,
                                                }}
                                            >
                                                Ctrl+Shift+
                                                <MouseLeftClickOutline />
                                            </Typography>
                                        </ListItemText>
                                    </MenuItem>
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    );
}
