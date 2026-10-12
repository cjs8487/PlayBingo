'use client';
import { ChevronRight } from '@mui/icons-material';
import { Box, Chip, Typography } from '@mui/material';
import { LevelBadge } from './LogInspector';
import { formatValue, LogRecord, previewMetadata } from './LogUtils';
export default function LogStreamEntry({
    log,
    compact,
    selected,
    onSelect,
}: {
    log: LogRecord;
    compact: boolean;
    selected: boolean;
    onSelect: (log: LogRecord) => void;
}) {
    return (
        <Box
            component="button"
            type="button"
            aria-label={`Inspect ${log.level} log: ${log.message}`}
            aria-pressed={selected}
            onClick={() => onSelect(log)}
            sx={{
                width: '100%',
                textAlign: 'left',
                color: 'text.primary',
                font: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: compact ? 'center' : 'flex-start',
                gap: 1.5,
                px: 2,
                py: compact ? 1 : 1.75,
                border: 0,
                borderBottom: '1px solid',
                borderBottomColor: 'divider',
                borderLeft: '3px solid',
                borderLeftColor: selected
                    ? 'primary.main'
                    : log.level === 'error'
                      ? '#df6570'
                      : 'transparent',
                bgcolor: selected
                    ? '#25344a'
                    : log.level === 'error'
                      ? '#ff667508'
                      : 'transparent',
                '&:hover': { bgcolor: '#ffffff08' },
                '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: -2,
                },
            }}
        >
            <Typography
                component="span"
                sx={{
                    fontFamily: 'monospace',
                    color: 'text.secondary',
                    fontSize: 12,
                    width: 94,
                    flexShrink: 0,
                }}
            >
                {Number.isFinite(log.time)
                    ? new Date(log.time).toLocaleTimeString(undefined, {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          fractionalSecondDigits: 3,
                      })
                    : '—'}
            </Typography>
            <Box sx={{ width: 64, flexShrink: 0 }}>
                <LevelBadge level={log.level} />
            </Box>
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexWrap: compact ? 'nowrap' : 'wrap',
                    gap: 1,
                    alignItems: 'center',
                }}
            >
                {log.source && (
                    <Chip
                        size="small"
                        label={log.source}
                        sx={{
                            display: {
                                xs: 'none',
                                md: 'inline-flex',
                            },
                            maxWidth: 100,
                            borderRadius: 1,
                            fontSize: 11,
                        }}
                    />
                )}
                <Typography
                    component="span"
                    sx={{
                        flex: '1 1 200px',
                        minWidth: 0,
                        fontSize: 13,
                        ...(compact
                            ? {
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                              }
                            : {
                                  whiteSpace: 'pre-wrap',
                                  overflowWrap: 'anywhere',
                              }),
                    }}
                >
                    {log.message}
                </Typography>
                <Box
                    sx={{
                        display: {
                            xs: 'none',
                            md: 'flex',
                        },
                        gap: 0.75,
                        flexWrap: compact ? 'nowrap' : 'wrap',
                        maxWidth: compact ? '40%' : '100%',
                        overflow: 'hidden',
                    }}
                >
                    {previewMetadata(log).map(([key, value]) => (
                        <Chip
                            key={key}
                            size="small"
                            label={`${key}=${formatValue(value)}`}
                            sx={{
                                maxWidth: 160,
                                borderRadius: 1,
                                height: 23,
                                fontSize: 10,
                                color: 'text.secondary',
                                bgcolor: '#ffffff08',
                            }}
                        />
                    ))}
                </Box>
            </Box>
            <ChevronRight
                sx={{
                    fontSize: 18,
                    color: 'text.secondary',
                    flexShrink: 0,
                }}
            />
        </Box>
    );
}
