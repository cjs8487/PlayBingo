'use client';
import {
    Box,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableProps,
    TableRow,
} from '@mui/material';
import { forwardRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { TableVirtuoso } from 'react-virtuoso';
import { useApi } from '../../../../lib/Hooks';
import { Game } from '../../../../types/Game';
import Delete from '@mui/icons-material/Delete';
import { useConfirm } from 'material-ui-confirm';
import { alertError } from '../../../../lib/Utils';

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

    const confirm = useConfirm();

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
                                            onClick={async () => {
                                                try {
                                                    await confirm({
                                                        title: `Delete ${game.name}?`,
                                                        description: `Are you sure you want to permnaently delete ${game.name} and all associated data? This cannot be undone.`,
                                                        confirmationButtonProps:
                                                            {
                                                                color: 'error',
                                                            },
                                                        confirmationText:
                                                            'Delete',
                                                    });

                                                    const res = await fetch(
                                                        `/api/games/${game.slug}`,
                                                        { method: 'DELETE' },
                                                    );
                                                    if (!res.ok) {
                                                        alertError(
                                                            `Failed to delete ${game.name} - ${await res.text()}`,
                                                        );
                                                        return;
                                                    }
                                                    mutate();
                                                } catch {
                                                    // do nothing
                                                }
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
        </Box>
    );
}
