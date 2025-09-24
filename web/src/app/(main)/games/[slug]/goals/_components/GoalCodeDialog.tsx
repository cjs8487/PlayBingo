'use client';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    Button,
    Box,
    Typography,
    IconButton,
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { useState, useEffect, useCallback } from 'react';
import { useGoalManagerContext } from '../../../../../../context/GoalManagerContext';
import JsonEditor from './JsonEditor';
import { notifyMessage } from '../../../../../../lib/Utils';

interface GoalCodeDialogProps {
    isOpen: boolean;
    close: () => void;
    slug: string;
}

export default function GoalCodeDialog({
    isOpen,
    close,
    slug,
}: GoalCodeDialogProps) {
    const { goals, shownGoals, mutateGoals } = useGoalManagerContext();
    const [jsonValue, setJsonValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{
        line?: number;
        column?: number;
        message?: string;
    } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Determine the order to use: match UI ordering when it represents the full list
    const getExportOrder = useCallback(() => {
        if (shownGoals && shownGoals.length === goals.length) {
            return shownGoals;
        }
        return goals;
    }, [goals, shownGoals]);

    // Convert goals to JSON format (without id and completedBy fields)
    const exportGoalsToJson = useCallback(() => {
        const ordered = getExportOrder();
        const goalsForExport = ordered.map((goal) => ({
            goal: goal.goal,
            description: goal.description,
            difficulty: goal.difficulty,
            categories: goal.categories || [],
        }));

        return JSON.stringify(goalsForExport, null, 2);
    }, [getExportOrder]);

    // Update JSON value when goals change or dialog opens
    useEffect(() => {
        if (isOpen) {
            setJsonValue(exportGoalsToJson());
            setError(null);
        }
    }, [isOpen, exportGoalsToJson]);

    const handleJsonChange = (value: string) => {
        setJsonValue(value);
        setError(null);

        // Validate JSON syntax
        try {
            JSON.parse(value);
        } catch (err) {
            if (err instanceof SyntaxError) {
                // Extract line and column from error message
                const match = err.message.match(/position (\d+)/);
                if (match) {
                    const pos = parseInt(match[1]);
                    const lines = value.substring(0, pos).split('\n');
                    setError({
                        line: lines.length,
                        column: lines[lines.length - 1].length + 1,
                        message: err.message,
                    });
                } else {
                    setError({
                        message: err.message,
                    });
                }
            }
        }
    };

    const handleSave = async () => {
        if (error) {
            notifyMessage('Please fix JSON syntax errors before saving');
            return;
        }

        setIsLoading(true);
        try {
            const parsedGoals = JSON.parse(jsonValue);

            // Validate that it's an array
            if (!Array.isArray(parsedGoals)) {
                throw new Error('Goals must be an array');
            }

            // Validate each goal has required fields
            for (const goal of parsedGoals) {
                if (!goal.goal) {
                    throw new Error('Each goal must have a goal field');
                }
            }

            // Replace all goals in a single API call (IDs will be regenerated)
            const response = await fetch('/api/goals/upload/replace', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slug: slug,
                    goals: parsedGoals,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to update goals: ${error}`);
            }

            // Refresh the goals list
            mutateGoals();
            notifyMessage('Goals updated successfully!');
            close();
        } catch (err) {
            notifyMessage(
                `Error saving goals: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setJsonValue(exportGoalsToJson());
        setError(null);
        setIsFullscreen(false);
        close();
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleCancel}
            maxWidth={isFullscreen ? false : 'lg'}
            fullWidth={!isFullscreen}
            fullScreen={isFullscreen}
        >
            <DialogTitle>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    Edit Goals as JSON
                    <IconButton onClick={toggleFullscreen} size="small">
                        {isFullscreen ? (
                            <FullscreenExitIcon />
                        ) : (
                            <FullscreenIcon />
                        )}
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Edit your goals directly in JSON format.
                    </Typography>
                </Box>

                <JsonEditor
                    value={jsonValue}
                    onChange={handleJsonChange}
                    error={error}
                    height={isFullscreen ? 'calc(100vh - 200px)' : 400}
                    placeholder="Enter goals in JSON format..."
                />

                <Box
                    sx={{
                        mt: 2,
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'flex-end',
                    }}
                >
                    <Button onClick={handleCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={isLoading || !!error}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
