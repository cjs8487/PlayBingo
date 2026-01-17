'use client';
import Board from '@/components/board/Board';
import PlayerInfo from '@/components/room/PlayerInfo';
import PlayerList from '@/components/room/PlayerList';
import RacetimeCard from '@/components/room/racetime/RacetimeCard';
import RoomChat from '@/components/room/RoomChat';
import RoomInfo from '@/components/room/RoomInfo';
import RoomLogin from '@/components/room/RoomLogin';
import { ConnectionStatus, useRoomContext } from '@/context/RoomContext';
import { Box, Dialog, DialogContent, Stack } from '@mui/material';

export default function Room() {
    const { connectionStatus, roomData } = useRoomContext();

    let showLogin = false;
    if (connectionStatus === ConnectionStatus.UNINITIALIZED) {
        showLogin = true;
    }

    // something went wrong attempting to connect to the server, show the login
    // page which when submitted will restart the connection process, or show an
    // adequate error message on failure
    if (connectionStatus === ConnectionStatus.CLOSED && !roomData) {
        showLogin = true;
    }

    return (
        <>
            <Box sx={{ width: '100%', height: '100%' }}>
                <Box
                    sx={{
                        display: { xs: 'flex', sm: 'none' },
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        flexDirection: 'column',
                        rowGap: 1.5,
                        p: 1,
                    }}
                >
                    <RoomXs />
                </Box>
                <Box
                    sx={{
                        display: {
                            xs: 'none',
                            sm: 'flex',
                            md: 'none',
                        },
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        flexDirection: 'column',
                        rowGap: 1.5,
                        p: 1,
                    }}
                >
                    <RoomSm />
                </Box>
                <Box
                    sx={{
                        display: {
                            xs: 'none',
                            md: 'flex',
                            lg: 'none',
                        },
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        flexDirection: 'column',
                        rowGap: 1.5,
                        p: 1,
                    }}
                >
                    <RoomMd />
                </Box>
                <Box
                    sx={{
                        display: {
                            xs: 'none',
                            lg: 'flex',
                            xl: 'none',
                        },
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        columnGap: 1,
                        p: 1,
                    }}
                >
                    <RoomLg />
                </Box>
                <Box
                    sx={{
                        display: { xs: 'none', xl: 'flex' },
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        columnGap: 1,
                        p: 1,
                    }}
                >
                    <RoomXl />
                </Box>
            </Box>
            <Dialog open={showLogin}>
                <DialogContent>
                    <RoomLogin />
                </DialogContent>
            </Dialog>
        </>
    );
}

function RoomXs() {
    return (
        <Stack spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
            <RoomInfo />
            <RacetimeCard />
            <PlayerInfo />
            <Box
                sx={{
                    width: '100%',
                    flex: '1 1 auto',
                    minHeight: '400px',
                    overflow: 'hidden',
                }}
            >
                <Board />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
                <PlayerList />
            </Box>
            <Box
                sx={{
                    height: '300px',
                    flex: '0 0 auto',
                }}
            >
                <RoomChat />
            </Box>
        </Stack>
    );
}

function RoomSm() {
    return (
        <Stack spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
            <Box sx={{ flex: '0 0 auto' }}>
                <RoomInfo />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
                <RacetimeCard />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
                <PlayerInfo />
            </Box>
            <Box
                sx={{
                    width: '100%',
                    flex: '1 1 auto',
                    minHeight: '400px',
                    overflow: 'hidden',
                }}
            >
                <Board />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
                <PlayerList />
            </Box>
            <Box
                sx={{
                    height: '300px',
                    flex: '0 0 auto',
                }}
            >
                <RoomChat />
            </Box>
        </Stack>
    );
}

function RoomMd() {
    return (
        <Stack spacing={2} sx={{ height: '100%', overflow: 'hidden' }}>
            <Box
                sx={{
                    display: 'flex',
                    columnGap: 2,
                    flex: '0 0 auto',
                }}
            >
                <Box sx={{ flex: 1 }}>
                    <RoomInfo />
                </Box>
                <Box sx={{ flex: '0 0 auto' }}>
                    <RacetimeCard />
                </Box>
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
                <PlayerInfo />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    columnGap: 1,
                    flex: '1 1 auto',
                    minHeight: '400px',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        flex: '1 1 auto',
                        minWidth: 0,
                        minHeight: '400px',
                        overflow: 'hidden',
                    }}
                >
                    <Board />
                </Box>
                <Box sx={{ flex: '0 0 auto', minWidth: '200px' }}>
                    <PlayerList />
                </Box>
            </Box>
            <Box
                sx={{
                    height: '300px',
                    flex: '0 0 auto',
                }}
            >
                <RoomChat />
            </Box>
        </Stack>
    );
}

function RoomLg() {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateRows: 'auto auto auto 1fr auto',
                gridTemplateColumns: 'minmax(0, 2fr) minmax(350px, 450px)',
                gap: 1,
                overflow: 'hidden',
            }}
        >
            <Box sx={{ gridRow: '1 / -1', gridColumn: 1, overflow: 'hidden' }}>
                <Board />
            </Box>
            <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
                <RoomInfo />
            </Box>
            <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
                <PlayerInfo />
            </Box>
            <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
                <RacetimeCard />
            </Box>
            <Box
                sx={{
                    gridRow: '4 / span 2',
                    gridColumn: 2,
                    overflow: 'hidden',
                }}
            >
                <PlayerList />
            </Box>
            <Box sx={{ gridRow: '5 / -1', gridColumn: 2, overflow: 'hidden' }}>
                <RoomChat />
            </Box>
        </Box>
    );
}

function RoomXl() {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateRows: 'auto auto auto auto 1fr',
                gridTemplateColumns:
                    'minmax(0, 2fr) minmax(350px, 450px) minmax(300px, 400px)',
                gap: 2,
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    gridRow: '1 / -1',
                    gridColumn: 1,
                    overflow: 'hidden',
                }}
            >
                <Board />
            </Box>
            <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
                <RoomInfo />
            </Box>
            <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
                <PlayerInfo />
            </Box>
            <Box sx={{ gridColumn: 2, overflow: 'hidden' }}>
                <RacetimeCard />
            </Box>
            <Box sx={{ gridRow: '4 / -1', gridColumn: 2, overflow: 'hidden' }}>
                <PlayerList />
            </Box>
            <Box sx={{ gridRow: '1 / -1', gridColumn: 3, overflow: 'hidden' }}>
                <RoomChat />
            </Box>
        </Box>
    );
}
