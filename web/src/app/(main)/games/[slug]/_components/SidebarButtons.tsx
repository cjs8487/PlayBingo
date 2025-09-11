'use client';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Tooltip,
    Typography,
} from '@mui/material';
import { Goal } from '@playbingo/types';
import { ReactNode, useCallback, useState } from 'react';
import RoomCreateForm from '../../../../../components/RoomCreateForm';
import { alertError } from '../../../../../lib/Utils';

interface Props {
    slug: string;
}
export default function SidebarButtons({ slug }: Props) {
    const [showDialog, setShowDialog] = useState(false);
    const [dialogContent, setDialogContent] = useState<ReactNode>(null);

    const showRoomDialog = useCallback(() => {
        setDialogContent(
            <>
                <DialogTitle>Create a Room</DialogTitle>
                <DialogContent>
                    <RoomCreateForm game={slug} />
                </DialogContent>
            </>,
        );
        setShowDialog(true);
    }, [slug]);

    const generateBoard = useCallback(async () => {
        const res = await fetch(`/api/games/${slug}/sampleBoard`);
        if (!res.ok) {
            alertError(`Failed to generate sample board - ${await res.text()}`);
            return;
        }
        const { board, seed }: { board: Goal[]; seed: number } =
            await res.json();
        setDialogContent(
            <>
                <DialogTitle></DialogTitle>
                <DialogContent sx={{ width: 'fit-content' }}>
                    <Typography sx={{ mb: 1 }}>Seed: {seed}</Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateRows: 'repeat(5, 1fr)',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            border: 1,
                            borderColor: 'divider',
                            width: 'fit-content',
                        }}
                    >
                        {board.map((goal) => (
                            <Tooltip
                                key={goal.id}
                                title={
                                    <>
                                        <Box sx={{ pb: 1.5 }}>
                                            {goal.description}
                                        </Box>
                                        {goal.difficulty && (
                                            <Box>
                                                Difficulty: {goal.difficulty}
                                            </Box>
                                        )}
                                        {goal.categories &&
                                            goal.categories.length > 0 && (
                                                <Box>
                                                    Categories:{' '}
                                                    {goal.categories.join(', ')}
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
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Typography textAlign="center">
                                        {goal.goal}
                                    </Typography>
                                </Box>
                            </Tooltip>
                        ))}
                    </Box>
                </DialogContent>
            </>,
        );
        setShowDialog(true);
    }, [slug]);

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
                onClick={generateBoard}
            >
                Generate Sample Board
            </Button>
            <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
                {dialogContent}
            </Dialog>
        </>
    );
}
