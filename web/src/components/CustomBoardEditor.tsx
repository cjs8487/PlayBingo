'use client';
import UploadIcon from '@mui/icons-material/Upload';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import JsonEditor from './JsonEditor';

interface CustomBoardEditorProps {
    value: string;
    onChange: (value: string) => void;
    onVerify: () => void;
    validationResult: {
        valid: boolean;
        error: string | null;
        location: string | null;
        suggestion: string | null;
    } | null;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onGenerateExample: () => void;
    onGenerateAdvanced: () => void;
    fileInputKey: number;
    helperText: string;
}

export default function CustomBoardEditor({
    value,
    onChange,
    onVerify,
    validationResult,
    onFileUpload,
    onGenerateExample,
    onGenerateAdvanced,
    fileInputKey,
    helperText,
}: CustomBoardEditorProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleFullscreenToggle = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleTextChange = (newValue: string) => {
        onChange(newValue);
    };

    // Parse error location to get line number
    const getErrorLine = (location: string | null): number | undefined => {
        if (!location) return undefined;

        // Handle row-X format
        if (location.startsWith('row-')) {
            return parseInt(location.split('-')[1]);
        }

        // Handle cell-X-Y format (use row number)
        if (location.startsWith('cell-')) {
            const parts = location.split('-');
            if (parts.length >= 3) {
                return parseInt(parts[1]);
            }
        }

        return undefined;
    };

    const content = (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <input
                    key={fileInputKey}
                    type="file"
                    accept=".json"
                    onChange={onFileUpload}
                    style={{ display: 'none' }}
                    id="custom-board-upload"
                />
                <label htmlFor="custom-board-upload">
                    <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadIcon />}
                        size="small"
                    >
                        Upload JSON
                    </Button>
                </label>
                <Button
                    variant="outlined"
                    onClick={onGenerateExample}
                    size="small"
                >
                    Simple Example
                </Button>
                <Button
                    variant="outlined"
                    onClick={onGenerateAdvanced}
                    size="small"
                >
                    Advanced Example
                </Button>
                <Button
                    variant="contained"
                    onClick={onVerify}
                    size="small"
                    color={validationResult?.valid ? 'success' : 'primary'}
                    disabled={!value}
                >
                    {validationResult?.valid ? '✓ Valid' : 'Verify'}
                </Button>
            </Box>

            {validationResult && !validationResult.valid && (
                <Alert
                    severity="error"
                    sx={{
                        '& .MuiAlert-message': {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        },
                    }}
                >
                    <Typography variant="subtitle2" fontWeight="bold">
                        Validation Error
                    </Typography>
                    <Typography variant="body2">
                        {validationResult.error}
                    </Typography>
                    {validationResult.suggestion && (
                        <Typography variant="body2" color="text.secondary">
                            💡 {validationResult.suggestion}
                        </Typography>
                    )}
                    {validationResult.location && (
                        <Typography variant="caption" color="text.secondary">
                            Location: {validationResult.location}
                        </Typography>
                    )}
                </Alert>
            )}

            {validationResult?.valid && (
                <Alert severity="success">
                    <Typography variant="body2">
                        ✓ Board structure is valid! Missing fields will be
                        auto-added when creating the room.
                    </Typography>
                </Alert>
            )}

            <Box>
                <Typography
                    variant="body2"
                    sx={{ mb: 1, color: 'text.secondary' }}
                >
                    Custom Board Data (JSON)
                </Typography>
                <JsonEditor
                    value={value}
                    onChange={handleTextChange}
                    height={isFullscreen ? 'calc(100vh - 300px)' : 200}
                    placeholder={`[
  [
    {
      "goal": {
        "goal": "Your goal text here"
      }
    },
    // ... 4 more cells in this row
  ],
  // ... 4 more rows
]`}
                    error={
                        validationResult && !validationResult.valid
                            ? {
                                  message:
                                      validationResult.error || 'Invalid JSON',
                                  line: getErrorLine(validationResult.location),
                              }
                            : null
                    }
                />
                {helperText && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: 'block' }}
                    >
                        {helperText}
                    </Typography>
                )}
            </Box>
        </Box>
    );

    if (isFullscreen) {
        return (
            <Dialog
                open={isFullscreen}
                onClose={handleFullscreenToggle}
                maxWidth="lg"
                fullWidth
                fullScreen
                PaperProps={{
                    sx: {
                        m: 0,
                        height: '100vh',
                        maxHeight: '100vh',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                >
                    Custom Board Editor
                    <IconButton onClick={handleFullscreenToggle}>
                        <FullscreenExitIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3, height: 'calc(100vh - 80px)' }}>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Box sx={{ position: 'relative' }}>
            {content}
            <IconButton
                onClick={handleFullscreenToggle}
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': {
                        backgroundColor: 'action.hover',
                    },
                }}
                size="small"
            >
                <FullscreenIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}
