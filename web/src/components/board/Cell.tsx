/* eslint-disable react-hooks/refs */
'use client';
import {
    arrow,
    autoUpdate,
    flip,
    FloatingArrow,
    offset,
    shift,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
} from '@floating-ui/react';
import { Add, Remove } from '@mui/icons-material';
import Star from '@mui/icons-material/Star';
import {
    Box,
    Chip,
    ClickAwayListener,
    IconButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    MenuList,
    Paper,
    SxProps,
    Tooltip,
    Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { Goal } from '@playbingo/types';
import { MouseLeftClickOutline, MouseRightClickOutline } from 'mdi-material-ui';
import Image from 'next/image';
import { MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '../../context/RoomContext';
import { getMediaForWorkflow } from '../../lib/Utils';
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
    const [menuOpen, setMenuOpen] = useState(false);

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

    const arrowRef = useRef<SVGSVGElement>(null);
    const { refs, floatingStyles, context } = useFloating({
        open: menuOpen,
        onOpenChange: setMenuOpen,
        middleware: [
            offset({ mainAxis: 5, alignmentAxis: 4 }),
            flip({
                fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
            }),
            shift({ padding: 10 }),
            arrow({
                element: arrowRef,
            }),
        ],
        placement: 'bottom-end',
        strategy: 'fixed',
        whileElementsMounted: autoUpdate,
    });
    const role = useRole(context, { role: 'menu' });
    const dismiss = useDismiss(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([
        role,
        dismiss,
    ]);

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
        setMenuOpen(false);
    };

    const handleListKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Tab') {
            event.preventDefault();
            setMenuOpen(false);
        } else if (event.key === 'Escape') {
            setMenuOpen(false);
        }
    };

    const handleCellClick = (e: MouseEvent<HTMLDivElement>) => {
        setMenuOpen(false);

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
                setMenuOpen(true);
            }
        }
    };

    return (
        <>
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
                                    {goal.categories
                                        .map((c) => c.name)
                                        .join(', ')}
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
                        hidden: menuOpen,
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
                    ref={refs.setReference}
                    {...getReferenceProps({
                        onMouseDown: handleCellClick,
                        onContextMenu: (e) => {
                            e.preventDefault();
                        },
                        onWheel: (e) => {
                            updateProgress(e.deltaY < 0 ? +1 : -1);
                        },
                    })}
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
                                            top: '8px',
                                            left: '8px',
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
                                            mt: 0.5,
                                            mr: 0.5,
                                            backgroundColor:
                                                goal.imageTag.color,
                                            opacity: 0.8,
                                        }}
                                    />
                                )}
                                {goal.count && (
                                    <Typography
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            pr: 1,
                                            filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0))',
                                            textShadow: '2px 2px black',
                                            fontSize: 18,
                                        }}
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
            {menuOpen && (
                <div
                    ref={refs.setFloating}
                    {...getFloatingProps({
                        style: { ...floatingStyles, zIndex: 100 },
                    })}
                >
                    <FloatingArrow
                        ref={arrowRef}
                        context={context}
                        fill={grey[900]}
                        stroke={grey[700]}
                        strokeWidth={1}
                    />
                    <Paper>
                        <ClickAwayListener onClickAway={handleClose}>
                            <MenuList
                                autoFocusItem={menuOpen}
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
                </div>
            )}
        </>
    );
}
