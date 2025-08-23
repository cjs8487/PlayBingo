'use client';
import Board from '@/components/board/Board';
import RoomChat from '@/components/room/RoomChat';
import RoomInfo from '@/components/room/RoomInfo';
import RoomLogin from '@/components/room/RoomLogin';
import { ConnectionStatus, useRoomContext } from '@/context/RoomContext';
import {
    Alert,
    Box,
    Container,
    Dialog,
    DialogContent,
    Link,
} from '@mui/material';
import AutoSizer from 'react-virtualized-auto-sizer';
import PlayerList from '../../../../components/room/PlayerList';
import RacetimeCard from '../../../../components/room/racetime/RacetimeCard';
import PlayerInfo from '../../../../components/room/PlayerInfo';
import NextLink from 'next/link';
import { useState } from 'react';

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
                {roomData?.newGenerator && <NewGeneratorBanner />}
                <AutoSizer>
                    {({ width, height }) => (
                        <>
                            <Box
                                sx={{
                                    display: { xs: 'flex', sm: 'none' },
                                    width: width,
                                    height: height - 50,
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
                                    width: width,
                                    height: height - 50,
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
                                    width: width,
                                    height: height - 50,
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
                                    width: width,
                                    height: height - 50,
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
                                    width: width,
                                    height: height - 50,
                                    overflowY: 'auto',
                                    columnGap: 1,
                                    p: 1,
                                }}
                            >
                                <RoomXl />
                            </Box>
                        </>
                    )}
                </AutoSizer>
            </Box>
            <Dialog open={showLogin}>
                <DialogContent>
                    <RoomLogin />
                </DialogContent>
            </Dialog>
        </>
    );
}

function NewGeneratorBanner() {
    const [show, setShow] = useState(true);
    if (!show) {
        return null;
    }
    return (
        <Alert
            severity="info"
            variant="filled"
            onClose={() => {
                setShow(false);
            }}
        >
            This game is using PlayBingo&apos;s new generation system. Bugs may
            occur. Report any issues you run into in the{' '}
            <Link
                component={NextLink}
                color="inherit"
                href="https://discord.gg/8sKNBaq8gu"
            >
                PlayBingo Discord server
            </Link>
            .
        </Alert>
    );
}

function RoomXs() {
    return (
        <>
            <Box>
                <RoomInfo />
            </Box>
            <Box>
                <RacetimeCard />
            </Box>
            <Box>
                <PlayerInfo />
            </Box>
            <Box
                sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                }}
            >
                <Board />
            </Box>
            <Box>
                <PlayerList />
            </Box>
            <Box
                sx={{
                    maxHeight: '90%',
                }}
            >
                <RoomChat />
            </Box>
        </>
    );
}

function RoomSm() {
    return (
        <>
            <Box
                sx={{
                    flexGrow: 1,
                }}
            >
                <RoomInfo />
            </Box>
            <Box>
                <RacetimeCard />
            </Box>
            <Box>
                <PlayerInfo />
            </Box>
            <Box
                sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                }}
            >
                <Board />
            </Box>
            <Box>
                <PlayerList />
            </Box>
            <Box
                sx={{
                    maxHeight: '90%',
                }}
            >
                <RoomChat />
            </Box>
        </>
    );
}

function RoomMd() {
    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    columnGap: 2,
                }}
            >
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <RoomInfo />
                </Box>
                <Box>
                    <RacetimeCard />
                </Box>
            </Box>
            <Box>
                <PlayerInfo />
            </Box>
            <Box
                sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'flex',
                    columnGap: 1,
                    alignContent: 'center',
                    justifyContent: 'center',
                }}
            >
                <Box
                    sx={{
                        width: '75%',
                        maxHeight: '100%',
                    }}
                >
                    <Board />
                </Box>
                <Box>
                    <PlayerList />
                </Box>
            </Box>
            <Box
                sx={{
                    px: 4,
                    maxHeight: '90%',
                }}
            >
                <RoomChat />
            </Box>
        </>
    );
}

function RoomLg() {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateRows: 'repeat(3, auto) 1fr auto 1fr auto',
                gridTemplateColumns: '1fr minmax(auto, 500px)',
                gap: 1,
            }}
        >
            <Box sx={{ gridRow: '1 / -1' }}>
                <Board />
            </Box>
            <Box>
                <RoomInfo />
            </Box>
            <Box>
                <PlayerInfo />
            </Box>
            <Box>
                <RacetimeCard />
            </Box>
            <Box sx={{ gridRow: '4 / span 2' }}>
                <PlayerList />
            </Box>
            <Box sx={{ gridRow: '6 / -1' }}>
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
                gridTemplateRows: 'repeat(4, auto) 1fr',
                gridTemplateColumns: '1fr auto minmax(auto, 400px)',
                gap: 2,
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    gridRow: '1 / -1',
                }}
            >
                <Board />
            </Box>
            <Box>
                <RoomInfo />
            </Box>
            <Box>
                <PlayerInfo />
            </Box>
            <Box>
                <RacetimeCard />
            </Box>
            <Box sx={{ gridRow: '4 / -1', gridColumn: 2 }}>
                <PlayerList />
            </Box>
            <Box sx={{ gridRow: '1 / -1', gridColumn: 3 }}>
                <RoomChat />
            </Box>
        </Box>
    );
}
