'use client';
import {
    Close,
    ContentCopy,
    FilterAlt,
    FilterAltOff,
} from '@mui/icons-material';
import {
    Box,
    Chip,
    IconButton,
    Snackbar,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { formatValue, isScalar, LogRecord, MetadataFilter } from './LogUtils';

export function LevelBadge({ level }: { level: string }) {
    const colors: Record<string, [string, string]> = {
        error: ['#ff929b', '#ff66751c'],
        warn: ['#ffd17b', '#ffbf471c'],
        info: ['#93bfff', '#518bdb24'],
    };
    const [color, backgroundColor] = colors[level] ?? ['#b7c2d2', '#8695ab24'];
    return (
        <Chip
            label={level.toUpperCase()}
            size="small"
            sx={{
                color,
                backgroundColor,
                borderRadius: 1,
                fontWeight: 700,
                fontSize: 11,
                height: 24,
            }}
        />
    );
}

export default function LogInspector({
    log,
    onClose,
    onFilter,
}: {
    log: LogRecord;
    onClose: () => void;
    onFilter: (filter: MetadataFilter) => void;
}) {
    const [feedback, setFeedback] = useState('');
    const copy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setFeedback('Copied to clipboard');
        } catch {
            setFeedback('Copy failed. Select the text to copy manually.');
        }
    };
    const copyButton = (value: string, label: string) => (
        <Tooltip title={label}>
            <IconButton
                size="small"
                aria-label={label}
                onClick={() => void copy(value)}
            >
                <ContentCopy sx={{ fontSize: 16 }} />
            </IconButton>
        </Tooltip>
    );
    const errorFields = Object.entries(log.metadata).filter(([key]) =>
        ['error', 'stack', 'trace', 'exception'].includes(key),
    );
    const codeStyle = {
        m: 0,
        p: 1.5,
        bgcolor: '#0c141d',
        borderRadius: 1,
        fontSize: 12,
        lineHeight: 1.65,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
    } as const;
    return (
        <Box sx={{ p: 2.5, minWidth: 0 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Typography variant="h6" id="log-inspector-title">
                    Log details
                </Typography>
                <IconButton aria-label="Close log details" onClick={onClose}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5, overflowWrap: 'anywhere' }}
            >
                {Number.isFinite(log.time)
                    ? new Date(log.time).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          fractionalSecondDigits: 3,
                      })
                    : log.timestamp}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <LevelBadge level={log.level} />
                {log.source && <Chip size="small" label={log.source} />}
            </Box>
            <Typography
                sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mb: 3 }}
            >
                {log.message}
            </Typography>
            <Typography sx={{ mb: 1, fontWeight: 600 }}>Metadata</Typography>
            {!Object.keys(log.metadata).length && (
                <Typography variant="body2" color="text.secondary">
                    No additional metadata.
                </Typography>
            )}
            <Box sx={{ mb: 3 }}>
                {Object.entries(log.metadata).map(([key, value]) => (
                    <Box
                        key={key}
                        sx={{
                            py: 0.75,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            display: 'grid',
                            gridTemplateColumns:
                                'minmax(80px, 0.65fr) minmax(0, 1fr)',
                            gap: 1,
                        }}
                    >
                        <Typography
                            component="span"
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: 12,
                                color: 'text.secondary',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {key}
                        </Typography>
                        <Box sx={{ minWidth: 0 }}>
                            {isScalar(value) ? (
                                <Typography
                                    component="span"
                                    sx={{
                                        fontFamily: 'monospace',
                                        fontSize: 12,
                                        overflowWrap: 'anywhere',
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {formatValue(value)}
                                </Typography>
                            ) : (
                                <Box component="details">
                                    <Box
                                        component="summary"
                                        sx={{ cursor: 'pointer', fontSize: 12 }}
                                    >
                                        {Array.isArray(value)
                                            ? `Array (${value.length})`
                                            : 'Object'}
                                    </Box>
                                    <Box component="pre" sx={codeStyle}>
                                        {formatValue(value)}
                                    </Box>
                                </Box>
                            )}
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                {copyButton(formatValue(value), `Copy ${key}`)}
                                {isScalar(value) && (
                                    <>
                                        <Tooltip title={`Include ${key}`}>
                                            <IconButton
                                                size="small"
                                                aria-label={`Filter by ${key}=${formatValue(value)}`}
                                                onClick={() =>
                                                    onFilter({
                                                        key,
                                                        value,
                                                        exclude: false,
                                                    })
                                                }
                                            >
                                                <FilterAlt
                                                    sx={{ fontSize: 16 }}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={`Exclude ${key}`}>
                                            <IconButton
                                                size="small"
                                                aria-label={`Exclude ${key}=${formatValue(value)}`}
                                                onClick={() =>
                                                    onFilter({
                                                        key,
                                                        value,
                                                        exclude: true,
                                                    })
                                                }
                                            >
                                                <FilterAltOff
                                                    sx={{ fontSize: 16 }}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>
            {errorFields.length > 0 && (
                <Box component="details" open sx={{ mb: 3 }}>
                    <Box
                        component="summary"
                        sx={{ cursor: 'pointer', fontWeight: 600, mb: 1 }}
                    >
                        Error details & stack trace
                    </Box>
                    {errorFields.map(([key, value]) => (
                        <Box key={key}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="caption">{key}</Typography>
                                {copyButton(
                                    formatValue(value),
                                    `Copy error ${key}`,
                                )}
                            </Box>
                            <Box component="pre" sx={codeStyle}>
                                {formatValue(value)}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                }}
            >
                <Typography sx={{ fontWeight: 600 }}>
                    Raw log entry · JSON
                </Typography>
                {copyButton(formatValue(log.raw), 'Copy raw JSON')}
            </Box>
            <Box component="pre" sx={codeStyle}>
                {typeof log.raw === 'string'
                    ? JSON.stringify(log.raw, null, 2)
                    : formatValue(log.raw)}
            </Box>
            <Snackbar
                open={!!feedback}
                autoHideDuration={3000}
                onClose={() => setFeedback('')}
                message={feedback}
            />
        </Box>
    );
}
