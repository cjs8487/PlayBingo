'use client';
import {
    Box,
    Button,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableProps,
    TableRow,
} from '@mui/material';
import { forwardRef, ReactNode, useCallback, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { TableVirtuoso } from 'react-virtuoso';
import { useApi } from '../../../../lib/Hooks';
import { Game } from '../../../../types/Game';
import Delete from '@mui/icons-material/Delete';
import { alertError, notifyMessage } from '../../../../lib/Utils';
import router from 'next/router';
import Dialog, { DialogRef } from '../../../../components/Dialog';

const Scroller = forwardRef<HTMLDivElement>(function Scroller(props, ref) {
    return <TableContainer {...props} ref={ref} />;
});
const VirtuosoTable = (props: TableProps) => (
    <Table {...props} style={{ borderCollapse: 'separate' }} />
);

const VirtuosoTableHead = forwardRef<HTMLTableSectionElement>(
    function VirtuosoTableHead(props, ref) {
        return <TableHead {...props} ref={ref} />;
    },
);

const VirtuosoTableBody = forwardRef<HTMLTableSectionElement>(
    function VirtusosoTableBody(props, ref) {
        return <TableBody {...props} ref={ref} />;
    },
);

export default function StaffGamesTab() {
    const {
        data: games,
        isLoading,
        error,
        mutate,
    } = useApi<Game[]>('/api/games');

    const [dialogContent, setDialogContent] = useState<ReactNode>(null);
    const confirmDialogRef = useRef<DialogRef | null>(null);

    const onDeleteClick = useCallback(
        (game: Game) => {
            setDialogContent(
                <>
                    <DialogTitle>Delete {game.name}?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to permnaently delete{' '}
                            {game.name} and all associated data? This cannot be
                            undone.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => confirmDialogRef.current?.close()}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="error"
                            onClick={async () => {
                                const res = await fetch(
                                    `/api/games/${game.slug}`,
                                    {
                                        method: 'DELETE',
                                    },
                                );
                                if (!res.ok) {
                                    alertError(
                                        `Failed to delete ${game.name} - ${await res.text()}`,
                                    );
                                    return;
                                }
                                mutate();
                                confirmDialogRef.current?.close();
                            }}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </>,
            );
            confirmDialogRef.current?.open();
        },
        [mutate],
    );

    if (isLoading || !games || error) {
        return null;
    }

    const gameList = [...games, ...games, ...games];

    return (
        <Box width="100%" height="100%" display="flex" flexDirection="column">
            <Box style={{ flexGrow: 1 }}>
                <AutoSizer>
                    {({ width, height }) => (
                        <TableVirtuoso
                            width={width}
                            height={height}
                            style={{ height, width }}
                            data={games}
                            components={{
                                Scroller,
                                Table: VirtuosoTable,
                                TableHead: VirtuosoTableHead,
                                TableBody: VirtuosoTableBody,
                            }}
                            fixedHeaderContent={() => (
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Owners</TableCell>
                                    <TableCell>Moderators</TableCell>
                                    <TableCell />
                                </TableRow>
                            )}
                            itemContent={(index, game) => (
                                <>
                                    <TableCell>{game.name}</TableCell>
                                    <TableCell>{game.owners?.length}</TableCell>
                                    <TableCell>
                                        {game.moderators?.length}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            onClick={() => {
                                                onDeleteClick(game);
                                            }}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </>
                            )}
                        />
                    )}
                </AutoSizer>
            </Box>
            <Dialog ref={confirmDialogRef}>{dialogContent}</Dialog>
        </Box>
    );
}
