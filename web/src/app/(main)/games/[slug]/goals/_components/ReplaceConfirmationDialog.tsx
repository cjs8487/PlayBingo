'use client';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';

interface ReplaceConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}

export default function ReplaceConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
}: ReplaceConfirmationDialogProps) {
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (confirmText.trim().toUpperCase() !== 'REPLACE') {
            setError("Type 'REPLACE' to confirm");
            return;
        }
        onConfirm();
    };

    const handleClose = () => {
        setConfirmText('');
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Confirm Goal Replacement</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>Warning:</strong> This action will replace
                            ALL goals for this game. This cannot be undone. Type
                            REPLACE below to confirm this action.
                        </Typography>
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                        Confirmation text (type REPLACE):
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    label="Type REPLACE to confirm"
                    value={confirmText}
                    onChange={(e) => {
                        setConfirmText(e.target.value);
                        setError(null);
                    }}
                    error={!!error}
                    helperText={error}
                    disabled={isLoading}
                    sx={{ mb: 2 }}
                />

                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'flex-end',
                    }}
                >
                    <Button
                        onClick={handleClose}
                        disabled={isLoading}
                        color="error"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="success"
                        disabled={
                            isLoading ||
                            confirmText.trim().toUpperCase() !== 'REPLACE'
                        }
                    >
                        {isLoading ? 'Replacing...' : 'Replace All Goals'}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
