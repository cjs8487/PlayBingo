'use client';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import {
    Box,
    Checkbox,
    Collapse,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography,
} from '@mui/material';
import { blue, blueGrey, orange, red } from '@mui/material/colors';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { useList } from 'react-use';
import AutoSizer from 'react-virtualized-auto-sizer';
import { TableComponents, Virtuoso } from 'react-virtuoso';
import { LogEntry } from '../page';

const colorMap: { [k: string]: string } = {
    error: red[900],
    warn: orange[900],
    info: blue[900],
    debug: blueGrey[800],
};

const VirtuosoTableRow: TableComponents<LogEntry, TableContext>['TableRow'] = ({
    context,
    item: entry,
    ...props
}) => {
    if (!context) {
        return null;
    }

    const { isExpanded, setExpanded } = context;
    const open = isExpanded(props['data-index']);

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    p: 1,
                    borderColor: 'divider',
                    borderLeft: open ? 1 : 0,
                }}
                {...props}
            >
                <IconButton
                    aria-label="expand row"
                    size="small"
                    onClick={() => setExpanded(props['data-index'])}
                    disabled={!('method' in entry)}
                >
                    {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                </IconButton>
                <Box>
                    {DateTime.fromISO(entry.timestamp).toLocaleString(
                        DateTime.DATETIME_MED,
                    )}
                </Box>
                <Box sx={{ color: colorMap[entry.level] }}>{entry.level}</Box>
                <Box>
                    {'room' in entry && `[${entry.room}] `}
                    {entry.message}
                </Box>
            </Box>
            {'method' in entry && (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box
                        sx={{
                            pl: 4,
                            borderColor: 'divider',
                            borderLeft: 1,
                        }}
                    >
                        <Typography variant="h6" gutterBottom component="div">
                            Additional Request Information
                        </Typography>
                        <Typography>User Agent: {entry.userAgent}</Typography>
                        <Typography>IP Address: {entry.ip}</Typography>
                        <Typography>Session Id: {entry.sessionId}</Typography>
                        <Typography>
                            Request completed in {entry.durationMs} ms
                        </Typography>
                    </Box>
                </Collapse>
            )}
        </>
    );
};

interface TableContext {
    isExpanded: (index: number) => boolean;
    setExpanded: (index: number) => void;
}

interface Props {
    logs: LogEntry[];
}

export default function LogTable({ logs }: Props) {
    const [expansionStatus, { updateAt }] = useList<boolean>();

    const isExpanded = (index: number) => !!expansionStatus[index];

    const setExpanded = (index: number) => {
        updateAt(index, !expansionStatus[index]);
    };

    const [shownLevels, { push: pushLevel, filter: filterLevels }] =
        useList<string>(['info', 'warn', 'error']);
    const [roomFilter, setRoomFilter] = useState('All logs');

    const shownLogs = logs
        .filter((log) => shownLevels.includes(log.level))
        .filter(
            (log) =>
                roomFilter === 'All logs' ||
                ('room' in log && log.room === roomFilter),
        );
    const rooms = logs.reduce<string[]>((rooms, log) => {
        if ('room' in log && !rooms.includes(log.room)) {
            rooms.push(log.room);
        }
        return rooms;
    }, []);

    const handleRoomChange = (event: SelectChangeEvent) => {
        setRoomFilter(event.target.value as string);
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box sx={{ display: 'flex' }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            onChange={(event) => {
                                if (event.target.checked) {
                                    pushLevel('debug');
                                } else {
                                    filterLevels((l) => l !== 'debug');
                                }
                            }}
                        />
                    }
                    label="Debug"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            defaultChecked
                            onChange={(event) => {
                                if (event.target.checked) {
                                    pushLevel('info');
                                } else {
                                    filterLevels((l) => l !== 'info');
                                }
                            }}
                        />
                    }
                    label="Info"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            defaultChecked
                            onChange={(event) => {
                                if (event.target.checked) {
                                    pushLevel('warn');
                                } else {
                                    filterLevels((l) => l !== 'warn');
                                }
                            }}
                        />
                    }
                    label="Warn"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            defaultChecked
                            onChange={(event) => {
                                if (event.target.checked) {
                                    pushLevel('error');
                                } else {
                                    filterLevels((l) => l !== 'error');
                                }
                            }}
                        />
                    }
                    label="Error"
                />
                <FormControl fullWidth>
                    <InputLabel id="room-select-label">Room</InputLabel>
                    <Select
                        labelId="room-select-label"
                        id="room-select"
                        value={roomFilter}
                        label="Room"
                        onChange={handleRoomChange}
                    >
                        <MenuItem value="All logs">All logs</MenuItem>
                        {rooms.map((room) => (
                            <MenuItem key={room} value={room}>
                                {room}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            <Box style={{ flexGrow: 1 }}>
                <AutoSizer>
                    {({ width, height }) => (
                        <Virtuoso<LogEntry, TableContext>
                            width={width}
                            height={height}
                            style={{ height, width }}
                            data={shownLogs}
                            components={{
                                Item: VirtuosoTableRow,
                            }}
                            initialTopMostItemIndex={logs.length}
                            context={{ isExpanded, setExpanded }}
                        />
                    )}
                </AutoSizer>
            </Box>
        </Box>
    );
}
