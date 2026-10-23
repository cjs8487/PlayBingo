'use client';
import { Refresh, Search } from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import { Dispatch, SetStateAction } from 'react';
import { formatValue, MetadataFilter } from './LogUtils';

interface Props {
    loading: boolean;
    refresh: () => void;
    search: string;
    setSearch: Dispatch<SetStateAction<string>>;
    newest: boolean;
    setNewest: Dispatch<SetStateAction<boolean>>;
    compact: boolean;
    setCompact: Dispatch<SetStateAction<boolean>>;
    levels: string[];
    setLevels: Dispatch<SetStateAction<string[]>>;
    availableLevels: string[];
    rooms: string[];
    filters: MetadataFilter[];
    setFilters: Dispatch<SetStateAction<MetadataFilter[]>>;
    addFilter: (filter: MetadataFilter) => void;
    clear: () => void;
}

export default function LogToolbar({
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
}: Props) {
    const room = filters.find(
        (filter) => filter.key === 'room' && !filter.exclude,
    );
    return (
        <Box
            sx={{
                p: 2,
                flexShrink: 0,
                borderBottom: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    mb: 1.5,
                }}
            >
                <TextField
                    size="small"
                    placeholder="Search messages and metadata…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    slotProps={{
                        htmlInput: { 'aria-label': 'Search logs' },
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{ flex: '1 1 240px' }}
                />
                <FormControl size="small" sx={{ minWidth: 145 }}>
                    <InputLabel id="log-order-label">Order</InputLabel>
                    <Select
                        labelId="log-order-label"
                        label="Order"
                        value={newest ? 'newest' : 'oldest'}
                        onChange={(event) =>
                            setNewest(event.target.value === 'newest')
                        }
                    >
                        <MenuItem value="oldest">Oldest first</MenuItem>
                        <MenuItem value="newest">Newest first</MenuItem>
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="log-density-label">Density</InputLabel>
                    <Select
                        labelId="log-density-label"
                        label="Density"
                        value={compact ? 'compact' : 'comfortable'}
                        onChange={(event) =>
                            setCompact(event.target.value === 'compact')
                        }
                    >
                        <MenuItem value="compact">Compact</MenuItem>
                        <MenuItem value="comfortable">Comfortable</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 210 }}>
                    <InputLabel id="log-level-label">Visible levels</InputLabel>
                    <Select
                        multiple
                        labelId="log-level-label"
                        label="Visible levels"
                        value={levels}
                        renderValue={(value) =>
                            value.length
                                ? value
                                      .map((level) => level.toUpperCase())
                                      .join(', ')
                                : 'None'
                        }
                        onChange={(event) =>
                            setLevels(
                                typeof event.target.value === 'string'
                                    ? event.target.value.split(',')
                                    : event.target.value,
                            )
                        }
                    >
                        {availableLevels.map((level) => (
                            <MenuItem key={level} value={level}>
                                {level.toUpperCase()}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl
                    size="small"
                    sx={{ minWidth: 180, flex: '0 1 240px' }}
                >
                    <InputLabel id="log-room-label">Room</InputLabel>
                    <Select
                        labelId="log-room-label"
                        label="Room"
                        value={
                            typeof room?.value === 'string' ? room.value : ''
                        }
                        onChange={(event) => {
                            setFilters((current) =>
                                current.filter(
                                    (filter) =>
                                        filter.key !== 'room' || filter.exclude,
                                ),
                            );
                            if (event.target.value)
                                addFilter({
                                    key: 'room',
                                    value: event.target.value,
                                    exclude: false,
                                });
                        }}
                    >
                        <MenuItem value="">All rooms</MenuItem>
                        {Array.from(
                            new Set([
                                ...rooms,
                                ...(typeof room?.value === 'string'
                                    ? [room.value]
                                    : []),
                            ]),
                        ).map((value) => (
                            <MenuItem key={value} value={value}>
                                {value}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    mt: 1.5,
                    alignItems: 'center',
                }}
            >
                {levels.length !== availableLevels.length && (
                    <Chip
                        size="small"
                        label={`Levels: ${levels.join(', ') || 'none'}`}
                        onDelete={() => setLevels(availableLevels)}
                    />
                )}
                {!!search && (
                    <Chip
                        size="small"
                        label={`Search: ${search}`}
                        onDelete={() => setSearch('')}
                    />
                )}
                {filters.map((filter, index) => (
                    <Chip
                        key={index}
                        size="small"
                        label={`${filter.exclude ? 'Exclude ' : ''}${filter.key}=${formatValue(filter.value)}`}
                        onDelete={() =>
                            setFilters((current) =>
                                current.filter((_, i) => i !== index),
                            )
                        }
                        sx={{ maxWidth: '100%' }}
                    />
                ))}
                {(filters.length > 0 ||
                    search ||
                    levels.length !== availableLevels.length) && (
                    <Button size="small" onClick={clear}>
                        Clear filters
                    </Button>
                )}
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="outlined"
                    startIcon={
                        loading ? <CircularProgress size={16} /> : <Refresh />
                    }
                    disabled={loading}
                    onClick={() => void refresh()}
                >
                    Refresh
                </Button>
            </Box>
        </Box>
    );
}
