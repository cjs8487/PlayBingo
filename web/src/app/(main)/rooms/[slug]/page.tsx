'use client';
import Board from '@/components/board/Board';
import RoomChat from '@/components/room/RoomChat';
import RoomInfo from '@/components/room/RoomInfo';
import RoomLogin from '@/components/room/RoomLogin';
import { ConnectionStatus, useRoomContext } from '@/context/RoomContext';
import { Box, Container } from '@mui/material';
import AutoSizer from 'react-virtualized-auto-sizer';
import PlayerList from '../../../../components/room/PlayerList';
import RacetimeCard from '../../../../components/room/racetime/RacetimeCard';
import PlayerInfo from '../../../../components/room/PlayerInfo';

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
        <AutoSizer>
            {({ width, height }) => (
                <>
                    <Box
                        sx={{
                            display: { xs: 'flex', sm: 'none' },
                            width: width,
                            height: height,
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
                            height: height,
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
                            height: height,
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
                            height: height,
                            overflowY: 'auto',
                            p: 1,
                        }}
                    >
                        <RoomLg />
                    </Box>
                    <Box
                        sx={{
                            display: { xs: 'none', xl: 'flex' },
                            width: width,
                            height: height,
                            overflowY: 'auto',
                            p: 1,
                        }}
                    >
                        <RoomXl />
                    </Box>
                </>
            )}
        </AutoSizer>
    );
}

function RoomXs() {
    return (
        <>
            xs
            <Box>
                <RoomInfo />
            </Box>
            <Box>
                <RacetimeCard />
            </Box>
            <Box>
                <PlayerInfo />
            </Box>
            <Box maxWidth="100%" maxHeight="100%">
                <Board />
            </Box>
            <Box>
                <PlayerList />
            </Box>
            <Box>
                <RoomChat />
            </Box>
        </>
    );
}

function RoomSm() {
    return (
        <>
            small
            <Box display="flex" columnGap={2}>
                <Box flexGrow={1}>
                    <RoomInfo />
                </Box>
                <Box>
                    <RacetimeCard />
                </Box>
            </Box>
            <Box>
                <PlayerInfo />
            </Box>
            <Box maxWidth="80%" maxHeight="100">
                <Board />
            </Box>
            <Box>
                <PlayerList />
            </Box>
            <Box>
                <RoomChat />
            </Box>
        </>
    );
}

function RoomMd() {
    return (
        <>
            <Box display="flex" columnGap={2}>
                <Box flexGrow={1}>
                    <RoomInfo />
                </Box>
                <Box>
                    <PlayerInfo />
                </Box>
            </Box>
            <Box>
                <RacetimeCard />
            </Box>
            <Box
                maxWidth="100%"
                maxHeight="100%"
                display="flex"
                columnGap={1}
                alignContent="center"
                justifyContent="center"
            >
                <Box width="75%" maxHeight="100%">
                    <Board />
                </Box>
                <Box>
                    <PlayerList />
                </Box>
            </Box>
            <Box px={4}>
                <RoomChat />
            </Box>
        </>
    );
}

function RoomLg() {
    return (
        <>
            <Box
                flexGrow={1}
                maxWidth="75%"
                maxHeight="100%"
                display="flex"
                alignContent="center"
                justifyContent="center"
            >
                <Board />
            </Box>
            <Box display="flex" flexDirection="column" rowGap={1}>
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
                <Box>
                    <RoomChat />
                </Box>
            </Box>
        </>
    );
}

function RoomXl() {
    return (
        <>
            <Box flexGrow={1} maxWidth="50%" maxHeight="100%">
                <Board />
            </Box>
            <Box display="flex" flexDirection="column" rowGap={1}>
                <Box display="flex" columnGap={1}>
                    <Box flexGrow={1}>
                        <RoomInfo />
                    </Box>
                    <RacetimeCard />
                </Box>
                <Box>
                    <PlayerInfo />
                </Box>
                <Box display="flex" columnGap={1}>
                    <Box>
                        <RoomChat />
                    </Box>
                    <Box>
                        <PlayerList />
                    </Box>
                </Box>
            </Box>
        </>
    );
}
