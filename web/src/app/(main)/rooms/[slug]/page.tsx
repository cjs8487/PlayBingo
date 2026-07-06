'use client';
import Board from '@/components/board/Board';
import PlayerInfo from '@/components/room/PlayerInfo';
import PlayerList from '@/components/room/PlayerList';
import RoomChat from '@/components/room/RoomChat';
import RoomInfo from '@/components/room/RoomInfo';
import RoomLogin from '@/components/room/RoomLogin';
import Timer from '@/components/room/timer/Timer';
import TimerControls from '@/components/room/timer/TimerControls';
import TimingMethodSelector from '@/components/room/timer/TimingMethodSelector';
import { ConnectionStatus, useRoomContext } from '@/context/RoomContext';
import { Refresh } from '@mui/icons-material';
import {
    alpha,
    Box,
    Button,
    Dialog,
    DialogContent,
    FormControlLabel,
    Paper,
    Stack,
    Switch,
    Typography,
} from '@mui/material';
import { Sword } from 'mdi-material-ui';
import ColorSelect from '../../../../components/room/ColorSelect';
import RoomHeader from '../../../../components/room/RoomHeader';

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
            <Box sx={{ width: '100%', height: '100%', maxHeight: '100%' }}>
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
            <Timer />
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
                <Timer />
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
                    <Timer />
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
                maxHeight: 'calc(100vh - 64px - 78px - 16px)',
                display: 'grid',
                gridTemplateRows: 'auto auto auto 1fr 1fr',
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
                <Timer />
            </Box>
            <Box
                sx={{
                    gridRow: 4,
                    gridColumn: 2,
                    overflow: 'hidden',
                }}
            >
                <PlayerList />
            </Box>
            <Box sx={{ gridRow: 5, gridColumn: 2, overflow: 'hidden' }}>
                <RoomChat />
            </Box>
        </Box>
    );
}

function RoomXl() {
    const {
        roomData,
        players,
        showCounters,
        toggleCounters,
        showGoalDetails,
        toggleGoalDetails,
        regenerateCard,
        connectedPlayer,
        setChatEnabled,
    } = useRoomContext();

    if (!roomData) {
        return null;
    }

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: '300px 1fr 300px',
                gridTemplateRows: 'auto',
            }}
        >
            <RoomHeader />
            <Paper
                sx={{
                    p: 1.5,
                    background: (theme) =>
                        alpha(theme.palette.background.paper, 0.5),
                }}
            >
                {players.map((player) => (
                    <Box
                        key={player.id}
                        sx={{
                            p: 1,
                            mb: 1,
                            borderLeft: 6,
                            borderColor: player.color,
                            boxShadow: `0 0 6px ${player.color}`,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Typography sx={{ flexGrow: 1 }}>
                            {player.nickname}
                        </Typography>
                        {player.monitor && (
                            <Sword fontSize="small" sx={{ color: 'green' }} />
                        )}
                    </Box>
                ))}
                <Box sx={{ my: 2, border: 1, borderColor: 'divider' }} />
                <ColorSelect />
                <Box sx={{ my: 2, border: 1, borderColor: 'divider' }} />
                <Box>
                    <Typography variant="h6">Settings</Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showCounters}
                                onChange={(e) => {
                                    if (e.target.checked !== showCounters) {
                                        toggleCounters();
                                    }
                                }}
                            />
                        }
                        label="Show Counters"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showGoalDetails}
                                onChange={(e) => {
                                    if (e.target.checked !== showGoalDetails) {
                                        toggleGoalDetails();
                                    }
                                }}
                            />
                        }
                        label="Show All Goal Details"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={roomData?.chatEnabled ?? true}
                                onChange={(e) =>
                                    setChatEnabled(e.target.checked)
                                }
                            />
                        }
                        label="Enable chat"
                    />
                    {connectedPlayer?.monitor && (
                        <Button
                            size="small"
                            onClick={() => regenerateCard()}
                            sx={{ width: '100%' }}
                            startIcon={<Refresh />}
                        >
                            Regenerate Card
                        </Button>
                    )}
                </Box>
                <Box sx={{ my: 2, border: 1, borderColor: 'divider' }} />
                <Box>
                    <Typography variant="h6">Timer Controls</Typography>
                    <TimingMethodSelector />
                    <TimerControls />
                </Box>
            </Paper>
            <Box
                sx={{ position: 'relative', height: '100%' }}
                className="board-wrapper"
            >
                <Board />
            </Box>
            <Box
                sx={{ position: 'relative', height: '100%' }}
                className="relative h-full"
            >
                <RoomChat />
            </Box>
        </Box>
    );
}
