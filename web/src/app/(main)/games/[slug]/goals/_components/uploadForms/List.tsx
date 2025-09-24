import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import { alertError, notifyMessage } from '../../../../../../../lib/Utils';
import JsonEditor from '../JsonEditor';
import type { UploadFormProps } from '../GoalUpload';

export function ListUploadForm({ slug, close }: UploadFormProps) {
    const [jsonValue, setJsonValue] = useState(`[
  "Goal text",
  "Another goal text",
  {
    "goal": "You can also specify additional properties like this",
    "description": "Extended information about the goal",
    "categories": ["Short", "Item"],
    "difficulty": 1
  }
]`);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{
        line?: number;
        column?: number;
        message?: string;
    } | null>(null);

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

    const handleSubmit = async () => {
        if (error) {
            notifyMessage('Please fix JSON syntax errors before uploading');
            return;
        }

        setIsLoading(true);
        try {
            let parsedList;
            try {
                parsedList = parseList(jsonValue);
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
        } catch (err) {
            alertError(
                `Error uploading goals: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
        } finally {
            setIsLoading(false);
        }
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
