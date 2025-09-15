'use client';
import { Close } from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { Goal } from '@playbingo/types';
import { ReactNode, useCallback, useState } from 'react';
import RoomCreateForm from '../../../../../components/RoomCreateForm';
import { alertError } from '../../../../../lib/Utils';
import TextFit from '../../../../../components/TextFit';

interface Props {
    slug: string;
}
export default function SidebarButtons({ slug }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [showSampleBoard, setShowSampleBoard] = useState(false);
    const [dialogContent, setDialogContent] = useState<ReactNode>(null);
    const [sampleBoard, setSampleBoard] = useState<Goal[]>([]);
    const [sampleSeed, setSampleSeed] = useState('');

    const generateSampleBoard = useCallback(async () => {
        const res = await fetch(`/api/games/${slug}/sampleBoard`);
        if (!res.ok) {
            alertError(`Failed to generate sample board - ${await res.text()}`);
            return;
        }
        const { board, seed }: { board: Goal[]; seed: string } =
            await res.json();
        setSampleBoard(board);
        setSampleSeed(seed);
    }, [slug]);

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

    const openSampleBoard = useCallback(async () => {
        await generateSampleBoard();
        setShowSampleBoard(true);
        setShowDialog(true);
    }, [generateSampleBoard]);

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
                sx={{ width: '100%', px: 0 }}
                onClick={openSampleBoard}
            >
                Generate Sample Board
            </Button>
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
                                {sampleBoard.map((goal) => (
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
                                ))}
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
