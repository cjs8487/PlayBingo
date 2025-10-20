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
import JsonEditor from '@/components/JsonEditor';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import type { Goal as SchemaGoal } from '@playbingo/types';
import ReplaceConfirmationDialog from './ReplaceConfirmationDialog';
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
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Determine the order to use: match UI ordering when it represents the full list
    const getExportOrder = useCallback(() => {
        if (shownGoals && shownGoals.length === goals.length) {
            return shownGoals;
        }
        return goals;
    }, [goals, shownGoals]);

    // Convert goals to JSON format (dynamically include all fields except excluded ones)
    const exportGoalsToJson = useCallback(() => {
        const ordered = getExportOrder();
        const allowedKeys: Array<keyof SchemaGoal> = [
            'goal',
            'description',
            'categories',
            'difficulty',
        ];

        const goalsForExport = ordered.map((g) => {
            const goal = g as unknown as Partial<SchemaGoal> &
                Record<string, unknown>;
            const picked: Record<string, unknown> = {};
            for (const key of allowedKeys) {
                const value = goal[key as string as keyof typeof goal];
                if (value !== undefined) {
                    picked[key as string] = value as unknown;
                }
            }
            return picked;
        });

        return JSON.stringify(goalsForExport, null, 2);
    }, [getExportOrder]);

    // Custom validation for goals
    const validateGoals = useCallback((parsedGoals: unknown) => {
        if (!Array.isArray(parsedGoals)) {
            return 'Goals must be an array';
        }

        for (const goal of parsedGoals) {
            if (!goal.goal) {
                return 'Each goal must have a goal field';
            }
        }

        return null;
    }, []);

    // Handle save logic
    const handleSave = useCallback(
        async (parsedGoals: unknown) => {
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
        },
        [slug, mutateGoals, close],
    );

    const {
        value: jsonValue,
        error,
        isLoading,
        handleChange: handleJsonChange,
        setValue: setJsonValue,
    } = useJsonEditor({
        initialValue: exportGoalsToJson(),
        onSave: handleSave,
        validate: validateGoals,
    });

    // Update JSON value when goals change or dialog opens
    useEffect(() => {
        if (isOpen) {
            setJsonValue(exportGoalsToJson());
        }
    }, [isOpen, exportGoalsToJson, setJsonValue]);

    const handleSaveClick = async () => {
        if (error) {
            notifyMessage('Please fix JSON syntax errors before saving');
            return;
        }
        setShowConfirmation(true);
    };

    const handleConfirmReplace = async () => {
        try {
            const parsedGoals = JSON.parse(jsonValue);
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
            setShowConfirmation(false);
            close();
        } catch (err) {
            notifyMessage(
                `Error saving goals: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
        }
    };

    const handleCancel = () => {
        setJsonValue(exportGoalsToJson());
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
                    <Button
                        onClick={handleCancel}
                        disabled={isLoading}
                        color="error"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveClick}
                        variant="contained"
                        color="success"
                        disabled={isLoading || !!error}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
            </DialogContent>
            <ReplaceConfirmationDialog
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={handleConfirmReplace}
                isLoading={isLoading}
            />
        </Dialog>
    );
}
