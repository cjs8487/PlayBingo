'use client';

import Delete from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { useRef } from 'react';
import Dialog, { DialogRef } from '../../../../../components/Dialog';
import { alertError, notifyMessage } from '../../../../../lib/Utils';
import router from 'next/router';

interface Props {
    slug: string;
}

export default function GameHeaderControls({ slug }: Props) {
    const confirmDialogRef = useRef<DialogRef | null>(null);

    return (
        <>
            <Box display="flex">
                <Button
                    sx={{ float: 'right' }}
                    color="error"
                    startIcon={<Delete />}
                    onClick={async () => {
                        confirmDialogRef.current?.open();
                    }}
                >
                    Delete Game
                </Button>
            </Box>
            <Dialog ref={confirmDialogRef}>
                <DialogTitle>Delete game?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this game? This cannot
                        be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => confirmDialogRef.current?.close()}>
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        onClick={async () => {
                            const res = await fetch(`/api/games/${slug}`, {
                                method: 'DELETE',
                            });
                            if (!res.ok) {
                                alertError(
                                    `Unable to delete game - ${await res.text()}`,
                                );
                                return;
                            }
                            router.push('/games');
                            notifyMessage('Game deleted');
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
