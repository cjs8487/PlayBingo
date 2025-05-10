'use client';
import Board from '@/components/board/Board';
import RoomChat from '@/components/room/RoomChat';
import RoomInfo from '@/components/room/RoomInfo';
import RoomLogin from '@/components/room/RoomLogin';
import { ConnectionStatus, useRoomContext } from '@/context/RoomContext';
import { Alert, Box, Container, Link } from '@mui/material';
import AutoSizer from 'react-virtualized-auto-sizer';
import PlayerList from '../../../../components/room/PlayerList';
import RacetimeCard from '../../../../components/room/racetime/RacetimeCard';
import PlayerInfo from '../../../../components/room/PlayerInfo';
import NextLink from 'next/link';

export default function Room() {
    const { connectionStatus, roomData } = useRoomContext();

    if (connectionStatus === ConnectionStatus.UNINITIALIZED) {
        return <RoomLogin />;
    }

    // something went wrong attempting to connect to the server, show the login
    // page which when submitted will restart the connection process, or show an
    // adequate error message on failure
    if (connectionStatus === ConnectionStatus.CLOSED && !roomData) {
        return <RoomLogin />;
    }

    return (
        <Box sx={{ width: '100%' }}>
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
                                display: { xs: 'none', sm: 'flex', md: 'none' },
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
                                display: { xs: 'none', md: 'flex', lg: 'none' },
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
                                display: { xs: 'none', lg: 'flex', xl: 'none' },
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
    );
}

function NewGeneratorBanner() {
    return (
        <Alert severity="info" variant="filled">
            This game is using PlayBingo's new generation system. Bugs may
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
        <>
            <Box
                sx={{
                    flexGrow: 1,
                    maxWidth: '75%',
                    maxHeight: '100%',
                    display: 'flex',
                    alignContent: 'center',
                    justifyContent: 'center',
                }}
            >
                <Board />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    rowGap: 1,
                    maxHeight: '100%',
                    overflowY: 'auto',
                }}
            >
                <Box>
                    <RoomInfo />
                </Box>
                <Box>
                    <PlayerInfo />
                </Box>
                <Box>
                    <RacetimeCard />
                </Box>
                <Box>
                    <PlayerList />
                </Box>
                <Box
                    sx={{
                        maxHeight: '85%',
                    }}
                >
                    <RoomChat />
                </Box>
            </Box>
        </>
    );
}

function RoomXl() {
    return (
        <>
            <Box
                sx={{
                    flexGrow: 1,
                    maxWidth: '50%',
                    maxHeight: '100%',
                    display: 'flex',
                    alignContent: 'center',
                    justifyContent: 'center',
                }}
            >
                <Board />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    columnGap: 1,
                    maxWidth: '50%',
                    maxHeight: '100%',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        rowGap: 1,
                        maxHeight: '100%',
                        overflowY: 'auto',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            columnGap: 1,
                        }}
                    >
                        <Box>
                            <RoomInfo />
                        </Box>
                        <Box>
                            <RacetimeCard />
                        </Box>
                    </Box>
                    <Box>
                        <PlayerInfo />
                    </Box>
                    <Box>
                        <PlayerList />
                    </Box>
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                        maxWidth: '40%',
                    }}
                >
                    <RoomChat />
                </Box>
            </Box>
        </>
    );
}
