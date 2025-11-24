import { useState, useCallback } from 'react';

export interface JsonError {
    line?: number;
    column?: number;
    message?: string;
}

export interface UseJsonEditorOptions {
    initialValue?: string;
    onSave?: (parsedValue: unknown) => Promise<void> | void;
    onCancel?: () => void;
    validate?: (value: unknown) => string | null; // Return error message or null
}

export interface UseJsonEditorReturn {
    value: string;
    error: JsonError | null;
    isLoading: boolean;
    setValue: (value: string) => void;
    handleChange: (value: string) => void;
    handleSave: () => Promise<void>;
    handleCancel: () => void;
    setError: (error: JsonError | null) => void;
    setLoading: (loading: boolean) => void;
}

export function useJsonEditor({
    initialValue = '',
    onSave,
    onCancel,
    validate,
}: UseJsonEditorOptions = {}): UseJsonEditorReturn {
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState<JsonError | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = useCallback(
        (newValue: string) => {
            setValue(newValue);
            setError(null);

            // Validate JSON syntax
            try {
                const parsed = JSON.parse(newValue);

                // Run custom validation if provided
                if (validate) {
                    const validationError = validate(parsed);
                    if (validationError) {
                        setError({
                            message: validationError,
                        });
                        return;
                    }
                }
            } catch (err) {
                if (err instanceof SyntaxError) {
                    // Extract line and column from error message
                    const match = err.message.match(/position (\d+)/);
                    if (match) {
                        const pos = parseInt(match[1]);
                        const lines = newValue.substring(0, pos).split('\n');
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
        },
        [validate],
    );

    const handleSave = useCallback(async () => {
        if (error) {
            return;
        }

        if (!onSave) {
            return;
        }

        setIsLoading(true);
        try {
            const parsed = JSON.parse(value);
            await onSave(parsed);
        } catch (err) {
            setError({
                message: err instanceof Error ? err.message : 'Unknown error',
            });
        } finally {
            setIsLoading(false);
        }
    }, [error, onSave, value]);

    const handleCancel = useCallback(() => {
        setValue(initialValue);
        setError(null);
        if (onCancel) {
            onCancel();
        }
    }, [initialValue, onCancel]);

    return {
        value,
        error,
        isLoading,
        setValue,
        handleChange,
        handleSave,
        handleCancel,
        setError,
        setLoading: setIsLoading,
    };
}
