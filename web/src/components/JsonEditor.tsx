'use client';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';
import { linter } from '@codemirror/lint';
import { Box, BoxProps } from '@mui/material';
import { useMemo } from 'react';

interface JsonEditorProps extends Omit<BoxProps, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    error?: {
        line?: number;
        column?: number;
        message?: string;
    } | null;
    placeholder?: string;
    readOnly?: boolean;
    height?: string | number;
    theme?: 'light' | 'dark';
}

export default function JsonEditor({
    value,
    onChange,
    error,
    placeholder,
    readOnly = false,
    height = 300,
    theme = 'light',
    ...boxProps
}: JsonEditorProps) {
    const darkTheme = useMemo(() => {
        return createTheme({
            theme: 'dark',
            settings: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                caret: '#d4d4d4',
                selection: '#264f78',
                selectionMatch: '#264f78',
                lineHighlight: '#2a2d2e',
                gutterBackground: '#1e1e1e',
                gutterForeground: '#858585',
                gutterActiveForeground: '#d4d4d4',
                gutterBorder: '1px solid #3e3e3e',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            },
            styles: [
                { tag: t.comment, color: '#6a9955' },
                { tag: t.variableName, color: '#9cdcfe' },
                { tag: [t.string, t.special(t.brace)], color: '#ce9178' },
                { tag: t.number, color: '#b5cea8' },
                { tag: t.bool, color: '#569cd6' },
                { tag: t.null, color: '#569cd6' },
                { tag: t.keyword, color: '#c586c0' },
                { tag: t.operator, color: '#d4d4d4' },
                { tag: t.className, color: '#4ec9b0' },
                { tag: t.definition(t.typeName), color: '#4ec9b0' },
                { tag: t.typeName, color: '#4ec9b0' },
                { tag: t.angleBracket, color: '#808080' },
                { tag: t.tagName, color: '#569cd6' },
                { tag: t.attributeName, color: '#9cdcfe' },
            ],
        });
    }, []);

    const jsonLinter = useMemo(() => {
        return linter((view) => {
            const diagnostics = [];
            try {
                JSON.parse(view.state.doc.toString());
            } catch (error) {
                if (error instanceof SyntaxError) {
                    // Extract line and column from error message
                    const match = error.message.match(/position (\d+)/);
                    if (match) {
                        const pos = parseInt(match[1]);
                        const line = view.state.doc.lineAt(pos);
                        diagnostics.push({
                            from: pos,
                            to: pos,
                            severity: 'error',
                            message: error.message,
                            line: line.number,
                        });
                    } else {
                        // Fallback: highlight the entire document
                        diagnostics.push({
                            from: 0,
                            to: view.state.doc.length,
                            severity: 'error',
                            message: error.message,
                        });
                    }
                }
            }
            return diagnostics;
        });
    }, []);

    const extensions = useMemo(() => {
        return [json(), darkTheme, jsonLinter];
    }, [darkTheme, jsonLinter]);

    const handleChange = (value: string) => {
        onChange(value);
    };

    return (
        <Box
            {...boxProps}
            sx={{
                '& .cm-editor': {
                    height: height,
                    border: '1px solid',
                    borderColor: error ? 'error.main' : 'divider',
                    borderRadius: 1,
                    '&:hover': {
                        borderColor: error ? 'error.main' : 'primary.main',
                    },
                    '&.cm-focused': {
                        borderColor: error ? 'error.main' : 'primary.main',
                        borderWidth: '2px',
                    },
                },
                // Error line highlighting
                ...(error?.line && {
                    [`& .cm-line:nth-child(${error.line})`]: {
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        borderLeft: '3px solid #f44336',
                        paddingLeft: '9px',
                    },
                }),
                ...boxProps.sx,
            }}
        >
            <CodeMirror
                value={value}
                onChange={handleChange}
                extensions={extensions}
                theme={darkTheme}
                placeholder={placeholder}
                readOnly={readOnly}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    highlightSelectionMatches: false,
                }}
            />
            {error && (
                <Box
                    sx={{
                        mt: 1,
                        p: 1,
                        backgroundColor: 'error.light',
                        color: 'error.contrastText',
                        borderRadius: 1,
                        fontSize: '0.875rem',
                    }}
                >
                    {error.line && error.column && (
                        <Box component="span" sx={{ fontWeight: 'bold' }}>
                            Line {error.line}, Column {error.column}:{' '}
                        </Box>
                    )}
                    {error.message}
                </Box>
            )}
        </Box>
    );
}
