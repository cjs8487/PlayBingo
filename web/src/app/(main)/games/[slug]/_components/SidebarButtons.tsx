'use client';
import { ArrowDropDown, Close } from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';
import { Game, Goal, Variant } from '@playbingo/types';
import { ReactNode, useCallback, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import RoomCreateForm from '../../../../../components/RoomCreateForm';
import TextFit from '../../../../../components/TextFit';
import { alertError } from '../../../../../lib/Utils';

interface SampleBoardDisplayProps {
    gameName: string;
    board: Goal[][];
    boardRows: number;
    boardCols: number;
    close: () => void;
    seed?: string;
    variant?: string;
}

function SampleBoardDisplay({
    gameName,
    board,
    boardRows,
    boardCols,
    close,
    seed,
    variant,
}: SampleBoardDisplayProps) {
    return (
        <>
            <DialogTitle>
                {gameName} {variant ? `${variant}` : ''} Sample Board ({seed})
            </DialogTitle>
            <IconButton
                aria-label="close"
                onClick={close}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                }}
            >
                <Close />
            </IconButton>
            <DialogContent sx={{}}>
                <AutoSizer
                    style={{
                        border: 1,
                        borderColor: 'divider',
                        height: '100%',
                    }}
                >
                    {({ width, height }) => {
                        // Maintain square cells by constraining board size
                        const aspectRatio = boardCols / boardRows;
                        let boardWidth = width;
                        let boardHeight = width / aspectRatio;
                        let leftMargin = 0;
                        let topMargin = 0;

                        if (boardHeight > height && width > 400) {
                            boardHeight = height;
                            boardWidth = height * aspectRatio;
                        }

                        const minBoardSize = Math.min(300);
                        if (boardWidth < minBoardSize) {
                            boardWidth = minBoardSize;
                            boardHeight = minBoardSize / aspectRatio;
                        }

                        if (boardWidth < width) {
                            leftMargin = (width - boardWidth) / 2;
                        }

                        if (boardHeight < height) {
                            topMargin = (height - boardHeight) / 2;
                        }

                        return (
                            <Box
                                sx={{
                                    width: boardWidth,
                                    height: boardHeight,
                                    display: 'grid',
                                    gridTemplateRows: `repeat(${boardRows}, ${boardHeight / boardRows}px)`,
                                    gridTemplateColumns: `repeat(${boardCols}, ${boardWidth / boardCols}px)`,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    ml: `${leftMargin}px`,
                                    mt: `${topMargin}px`,
                                }}
                            >
                                {board.map((row) =>
                                    row.map((goal) => (
                                        <Tooltip
                                            key={goal.id}
                                            title={
                                                <>
                                                    <Box sx={{ pb: 1.5 }}>
                                                        {goal.description}
                                                    </Box>
                                                    {goal.difficulty && (
                                                        <Box>
                                                            Difficulty:{' '}
                                                            {goal.difficulty}
                                                        </Box>
                                                    )}
                                                    {goal.categories &&
                                                        goal.categories.length >
                                                            0 && (
                                                            <Box>
                                                                Categories:{' '}
                                                                {goal.categories
                                                                    .map(
                                                                        (c) =>
                                                                            c.name,
                                                                    )
                                                                    .join(', ')}
                                                            </Box>
                                                        )}
                                                </>
                                            }
                                        >
                                            <Box
                                                sx={{
                                                    position: 'relative',
                                                    aspectRatio: '1 / 1',
                                                    flexGrow: 1,
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '100%',
                                                    height: '100%',
                                                }}
                                            >
                                                <TextFit
                                                    text={goal.goal}
                                                    sx={{
                                                        textAlign: 'center',
                                                        p: 1,
                                                    }}
                                                />
                                            </Box>
                                        </Tooltip>
                                    )),
                                )}
                            </Box>
                        );
                    }}
                </AutoSizer>
            </DialogContent>
        </>
    );
}

interface Props {
    game: Game;
    variants: Variant[];
}
export default function SidebarButtons({ game, variants }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [showSampleBoard, setShowSampleBoard] = useState(false);
    const [dialogContent, setDialogContent] = useState<ReactNode>(null);
    const [sampleBoard, setSampleBoard] = useState<Goal[][]>([]);
    const [sampleSeed, setSampleSeed] = useState('');
    const [sampleVariant, setSampleVariant] = useState<string | undefined>('');
    const [sampleWidth, setSampleWidth] = useState(5);
    const [sampleHeight, setSampleHeight] = useState(5);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const { slug, name: gameName } = game;

    const handleClose = () => {
        setAnchorEl(null);
    };

    const generateSampleBoard = useCallback(
        async (variantId?: string) => {
            const res = await fetch(
                `/api/games/${slug}/sampleBoard${variantId ? `?variant=${variantId}` : ''}`,
            );
            if (!res.ok) {
                alertError(await res.text());
                return false;
            }
            const {
                board,
                seed,
                variant,
                width,
                height,
            }: {
                board: Goal[][];
                seed: string;
                variant: string | undefined;
                width: number;
                height: number;
            } = await res.json();
            setSampleBoard(board);
            setSampleSeed(seed);
            setSampleVariant(variant);
            setSampleWidth(width);
            setSampleHeight(height);
            handleClose();
            return true;
        },
        [slug],
    );

    const showRoomDialog = useCallback(() => {
        setDialogContent(
            <>
                <DialogTitle>Create a Room</DialogTitle>
                <DialogContent>
                    <RoomCreateForm game={slug} />
                </DialogContent>
            </>,
        );
        setShowSampleBoard(false);
        setShowDialog(true);
    }, [slug]);

    const openSampleBoard = useCallback(
        async (variant?: string) => {
            const success = await generateSampleBoard(variant);
            if (success) {
                setShowSampleBoard(true);
                setShowDialog(true);
            }
        },
        [generateSampleBoard],
    );

    const handleSampleBoardButton = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            if (variants.length > 0) {
                setAnchorEl(event.currentTarget);
            } else {
                openSampleBoard();
            }
        },
        [openSampleBoard, variants],
    );

    return (
        <>
            <Button
                variant="outlined"
                sx={{ width: '100%', px: 0 }}
                onClick={showRoomDialog}
            >
                Create Room
            </Button>
            <Button
                variant="outlined"
                sx={{ width: '100%' }}
                onClick={handleSampleBoardButton}
                endIcon={variants.length > 0 ? <ArrowDropDown /> : null}
                id="sample-board-button"
                aria-controls={open ? 'sample-board-menu' : undefined}
                aria-haspopup={variants.length > 0 ? 'true' : undefined}
                aria-expanded={open ? 'true' : undefined}
            >
                Sample Board
            </Button>
            <Menu
                id="sample-board-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                slotProps={{
                    list: {
                        'aria-labelledby': 'sample-board-button',
                    },
                }}
            >
                <MenuItem onClick={() => openSampleBoard()}>Normal</MenuItem>
                {variants.map((variant) => (
                    <MenuItem
                        key={variant.id}
                        onClick={() => openSampleBoard(variant.id)}
                    >
                        {variant.name}
                    </MenuItem>
                ))}
            </Menu>
            <Dialog
                open={showDialog}
                onClose={() => setShowDialog(false)}
                fullScreen={showSampleBoard}
            >
                {showSampleBoard ? (
                    <SampleBoardDisplay
                        gameName={gameName}
                        board={sampleBoard}
                        boardCols={sampleWidth}
                        boardRows={sampleHeight}
                        close={() => setShowDialog(false)}
                        seed={sampleSeed}
                        variant={sampleVariant}
                    />
                ) : (
                    dialogContent
                )}
            </Dialog>
        </>
    );
}
