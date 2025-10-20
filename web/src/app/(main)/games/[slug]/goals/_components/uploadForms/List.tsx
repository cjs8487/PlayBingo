import { Box, Button, Typography } from '@mui/material';
import { useCallback } from 'react';
import { alertError, notifyMessage } from '../../../../../../../lib/Utils';
import JsonEditor from '@/components/JsonEditor';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import type { UploadFormProps } from '../GoalUpload';

export function ListUploadForm({ slug, close }: UploadFormProps) {
    const initialValue = `[
  "Goal text",
  "Another goal text",
  {
    "goal": "You can also specify additional properties like this",
    "description": "Extended information about the goal",
    "categories": ["Short", "Item"],
    "difficulty": 1
  }
]`;

    // Handle save logic
    const handleSave = useCallback(
        async (parsedGoals: unknown) => {
            let parsedList;
            try {
                parsedList = parseList(JSON.stringify(parsedGoals));
            } catch {
                alertError('Unable to parse file contents');
                return;
            }

            const goals = parsedList.flat();
            const res = await fetch('/api/goals/upload/list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slug,
                    goals,
                }),
            });

            if (!res.ok) {
                const error = await res.text();
                alertError(`Could not upload results - ${error}`);
                return;
            }

            notifyMessage('Goals uploaded successfully!');
            close();
        },
        [slug, close],
    );

    const {
        value: jsonValue,
        error,
        isLoading,
        handleChange: handleJsonChange,
        handleSave: handleSaveWrapper,
    } = useJsonEditor({
        initialValue,
        onSave: handleSave,
    });

    const handleSubmit = async () => {
        if (error) {
            notifyMessage('Please fix JSON syntax errors before uploading');
            return;
        }
        await handleSaveWrapper();
    };

    return (
        <Box>
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Upload goals in JSON format. You can use simple strings or
                    objects with additional properties.
                </Typography>
            </Box>

            <JsonEditor
                value={jsonValue}
                onChange={handleJsonChange}
                error={error}
                height={400}
                placeholder="Enter your goals in JSON format..."
            />

            <Box
                sx={{
                    mt: 2,
                    display: 'flex',
                }}
            >
                <Button
                    type="button"
                    color="error"
                    onClick={close}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                />
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="success"
                    disabled={isLoading || !!error}
                >
                    {isLoading ? 'Uploading...' : 'Submit'}
                </Button>
            </Box>
        </Box>
    );
}

function parseList(data: string): string[] {
    return JSON.parse(data);
}
