'use client';
import {
    Alert,
    Box,
    Button,
    Drawer,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Virtuoso } from 'react-virtuoso';
import LogInspector from './LogInspector';
import LogStreamEntry from './LogStreamEntry';
import LogToolbar from './LogToolbar';
import {
    defaultLevels,
    filterLogs,
    LogRecord,
    MetadataFilter,
    normalizeLogs,
} from './LogUtils';

const panel = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    bgcolor: '#141e29',
    overflow: 'hidden',
};
export default function LogViewer({
    initialLogs,
    initialError,
}: {
    initialLogs: unknown[];
    initialError: string | null;
}) {
    const [rawLogs, setRawLogs] = useState(initialLogs);
    const error = initialError;
    const [lastLogs, setLastLogs] = useState(initialLogs);
    const [loading, startTransition] = useTransition();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [levels, setLevels] = useState(defaultLevels);
    const [filters, setFilters] = useState<MetadataFilter[]>([]);
    const [newest, setNewest] = useState(false);
    const [compact, setCompact] = useState(true);
    const [selected, setSelected] = useState<LogRecord | null>(null);
    const wide = useMediaQuery(useTheme().breakpoints.up('lg'));

    if (lastLogs !== initialLogs) {
        setLastLogs(initialLogs);
        if (!initialError) {
            setRawLogs(initialLogs);
            setSelected(null);
        }
    }
    const logs = useMemo(() => normalizeLogs(rawLogs), [rawLogs]);
    const shown = useMemo(
        () => filterLogs(logs, levels, search, filters, newest),
        [logs, levels, search, filters, newest],
    );
    const availableLevels = useMemo(
        () =>
            Array.from(
                new Set([
                    'error',
                    'warn',
                    'info',
                    'debug',
                    'trace',
                    ...logs.map((log) => log.level),
                ]),
            ),
        [logs],
    );
    const rooms = useMemo(
        () =>
            Array.from(
                new Set(
                    logs.flatMap((log) =>
                        typeof log.metadata.room === 'string'
                            ? [log.metadata.room]
                            : [],
                    ),
                ),
            ).sort(),
        [logs],
    );
    const addFilter = (filter: MetadataFilter) =>
        setFilters((current) => [
            ...current.filter(
                (item) =>
                    !(
                        item.key === filter.key &&
                        item.exclude === filter.exclude
                    ),
            ),
            filter,
        ]);
    const refresh = () => {
        if (loading) return;
        startTransition(() => router.refresh());
    };
    const clear = () => {
        setSearch('');
        setFilters([]);
        setLevels(availableLevels);
    };
    const inspector = selected && (
        <LogInspector
            log={selected}
            onClose={() => setSelected(null)}
            onFilter={addFilter}
        />
    );
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                width: '100%',
                minWidth: 0,
                minHeight: 0,
                flex: 1,
                alignItems: 'stretch',
            }}
        >
            <Box
                sx={{
                    ...panel,
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <LogToolbar
                    {...{
                        loading,
                        refresh,
                        search,
                        setSearch,
                        newest,
                        setNewest,
                        compact,
                        setCompact,
                        levels,
                        setLevels,
                        availableLevels,
                        rooms,
                        filters,
                        setFilters,
                        addFilter,
                        clear,
                    }}
                />
                {error && (
                    <Alert
                        severity="error"
                        sx={{ m: 2 }}
                        action={
                            <Button
                                color="inherit"
                                disabled={loading}
                                onClick={() => void refresh()}
                            >
                                Retry
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}
                <Box
                    aria-busy={loading}
                    sx={{ flex: '1 1 0', minHeight: 0, minWidth: 0 }}
                >
                    {shown.length ? (
                        <Virtuoso
                            data={shown}
                            style={{ height: '100%' }}
                            computeItemKey={(_, log) => log.id}
                            itemContent={(_, log) => (
                                <LogStreamEntry
                                    log={log}
                                    compact={compact}
                                    selected={selected?.id === log.id}
                                    onSelect={setSelected}
                                />
                            )}
                        />
                    ) : (
                        <Box
                            sx={{
                                height: '100%',
                                display: 'grid',
                                placeContent: 'center',
                                p: 3,
                                textAlign: 'center',
                            }}
                        >
                            <Typography sx={{ fontWeight: 600 }}>
                                {loading
                                    ? 'Loading logs…'
                                    : error
                                      ? 'Logs unavailable'
                                      : logs.length
                                        ? 'No matching entries'
                                        : 'No logs available'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {logs.length
                                    ? 'Adjust your search or clear filters to see more entries.'
                                    : 'Refresh to check the current server log file.'}
                            </Typography>
                            {logs.length > 0 && (
                                <Button onClick={clear}>Clear filters</Button>
                            )}
                        </Box>
                    )}
                </Box>
                <Box
                    role="status"
                    sx={{
                        px: 2,
                        py: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        flexShrink: 0,
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        {logs.length} total entries · {shown.length} matching
                    </Typography>
                </Box>
            </Box>
            {wide && selected && (
                <Box
                    component="aside"
                    aria-labelledby="log-inspector-title"
                    sx={{
                        ...panel,
                        width: 380,
                        flexShrink: 0,
                        minHeight: 0,
                        overflowY: 'auto',
                    }}
                >
                    {inspector}
                </Box>
            )}
            {!wide && (
                <Drawer
                    anchor="right"
                    open={!!selected}
                    onClose={() => setSelected(null)}
                    slotProps={{
                        paper: {
                            sx: {
                                width: { xs: '100%', sm: 420 },
                                bgcolor: '#141e29',
                            },
                            'aria-labelledby': 'log-inspector-title',
                        },
                    }}
                >
                    {inspector}
                </Drawer>
            )}
        </Box>
    );
}
