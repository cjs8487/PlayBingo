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
    Typography,
} from '@mui/material';
import { Goal, Variant } from '@playbingo/types';
import { ReactNode, useCallback, useState } from 'react';
import RoomCreateForm from '../../../../../components/RoomCreateForm';
import { alertError } from '../../../../../lib/Utils';
import TextFit from '../../../../../components/TextFit';

interface Props {
    slug: string;
    variants: Variant[];
}
export default function SidebarButtons({ slug, variants }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [showSampleBoard, setShowSampleBoard] = useState(false);
    const [dialogContent, setDialogContent] = useState<ReactNode>(null);
    const [sampleBoard, setSampleBoard] = useState<Goal[][]>([]);
    const [sampleSeed, setSampleSeed] = useState('');
    const [sampleVariant, setSampleVariant] = useState<string | undefined>('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

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
            }: { board: Goal[][]; seed: string; variant: string | undefined } =
                await res.json();
            setSampleBoard(board);
            setSampleSeed(seed);
            setSampleVariant(variant);
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
            <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
                {showSampleBoard ? (
                    <>
                        <DialogTitle>Sample Board</DialogTitle>
                        <IconButton
                            aria-label="close"
                            onClick={() => setShowDialog(false)}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                            }}
                        >
                            <Close />
                        </IconButton>
                        <DialogContent>
                            <Typography sx={{ mb: 1 }}>
                                Seed: {sampleSeed}
                            </Typography>
                            {sampleVariant && (
                                <Typography sx={{ mb: 1 }}>
                                    Variant: {sampleVariant}
                                </Typography>
                            )}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateRows: 'repeat(5, 1fr)',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    border: 1,
                                    borderColor: 'divider',
                                    width: '100%',
                                    aspectRatio: '1 / 1',
                                }}
                            >
                                {sampleBoard.map((row) =>
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
                                                                {goal.categories.join(
                                                                    ', ',
                                                                )}
                                                            </Box>
                                                        )}
                                                </>
                                            }
                                        >
                                            <Box
                                                sx={{
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    aspectRatio: '1 / 1',
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
                                                    }}
                                                />
                                            </Box>
                                        </Tooltip>
                                    )),
                                )}
                            </Box>
                        </DialogContent>
                    </>
                ) : (
                    dialogContent
                )}
            </Dialog>
        </>
    );
}
