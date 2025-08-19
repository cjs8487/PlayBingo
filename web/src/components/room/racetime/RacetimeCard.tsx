import Refresh from '@mui/icons-material/Refresh';
import {
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    Link,
    Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useRoomContext } from '../../../context/RoomContext';
import { useUserContext } from '../../../context/UserContext';
import Timer from './Timer';

export default function RacetimeCard() {
    const {
        roomData,
        createRacetimeRoom,
        updateRacetimeRoom,
        joinRacetimeRoom,
        racetimeReady,
        racetimeUnready,
        connectedPlayer,
    } = useRoomContext();
    const { loggedIn, user } = useUserContext();

    if (!roomData) {
        return null;
    }

    const { racetimeConnection } = roomData;
    if (!racetimeConnection) {
        return null;
    }

    const { gameActive, url, status } = racetimeConnection;
    if (!gameActive) {
        return null;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">racetime.gg</Typography>
                {!url && (
                    <>
                        <Typography
                            variant="body2"
                            sx={{
                                fontStyle: 'italic',
                            }}
                        >
                            Not connected
                        </Typography>
                        {loggedIn && connectedPlayer?.monitor && (
                            <Button onClick={createRacetimeRoom}>
                                Create race room
                            </Button>
                        )}
                    </>
                )}
                {url && (
                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Link
                                component={NextLink}
                                href={url}
                                target="_blank"
                            >
                                Connected
                            </Link>
                            <IconButton onClick={updateRacetimeRoom}>
                                <Refresh />
                            </IconButton>
                            {user?.racetimeConnected &&
                                !connectedPlayer?.spectator && (
                                    <>
                                        <Button onClick={joinRacetimeRoom}>
                                            Join Race
                                        </Button>
                                        {connectedPlayer?.raceStatus
                                            .connected && (
                                            <>
                                                {connectedPlayer.raceStatus
                                                    .ready ? (
                                                    <Button
                                                        onClick={
                                                            racetimeUnready
                                                        }
                                                    >
                                                        Not ready
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={racetimeReady}
                                                    >
                                                        Ready
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                        </Box>
                    </Box>
                )}
                {status && (
                    <>
                        <Typography>{status}</Typography>
                        <Timer />
                    </>
                )}
            </CardContent>
        </Card>
    );
}
