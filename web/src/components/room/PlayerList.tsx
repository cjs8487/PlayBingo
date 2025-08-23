import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Paper,
    Typography,
} from '@mui/material';
import { Duration } from 'luxon';
import { Sword } from 'mdi-material-ui';
import { useContext } from 'react';
import { RoomContext } from '../../context/RoomContext';
export default function PlayerList() {
    const {
        players: allPlayers,
        roomData,
        joinRacetimeRoom,
    } = useContext(RoomContext);
    const racetimeConnected = !!roomData?.racetimeConnection?.url;

    const players = allPlayers.filter((p) => !p.spectator);
    const spectators = allPlayers.filter((p) => p.spectator);
    return (
        <Paper
            sx={{
                display: 'flex',
                maxHeight: '100%',
                flexDirection: 'column',
                rowGap: 1,
                p: 2,
            }}
        >
            <Typography variant="h6">
                Connected Players ({players.length})
            </Typography>
            <Box
                sx={{
                    flexGrow: 1,
                    maxHeight: '100%',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    rowGap: 1,
                }}
            >
                {players.map((player) => (
                    <Box key={player.id}>
                        <Box
                            sx={{
                                display: 'flex',
                                columnGap: 1,
                                alignItems: 'center',
                            }}
                        >
                            <Box
                                style={{ background: player.color }}
                                sx={{
                                    px: 0.5,
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography>{player.goalCount}</Typography>
                            </Box>
                            {player.monitor && (
                                <Sword
                                    fontSize="small"
                                    sx={{ color: 'green' }}
                                />
                            )}
                            <Typography>{player.nickname}</Typography>
                        </Box>
                        {racetimeConnected && (
                            <>
                                {!player.racetimeStatus.connected && (
                                    <Typography>Not connected</Typography>
                                )}
                                {player.racetimeStatus.connected && (
                                    <Typography>
                                        {player.racetimeStatus.username} -{' '}
                                        {player.racetimeStatus.status}
                                        {player.racetimeStatus.finishTime &&
                                            ` - ${Duration.fromISO(player.racetimeStatus.finishTime).toFormat('h:mm:ss')}`}
                                    </Typography>
                                )}
                            </>
                        )}
                    </Box>
                ))}
                {spectators.length > 0 && (
                    <>
                        <Typography variant="h6">Spectators</Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                rowGap: 3,
                            }}
                        >
                            {spectators.map((player) => (
                                <Box key={player.nickname}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            columnGap: 2,
                                        }}
                                    >
                                        <Typography>
                                            {player.nickname}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </>
                )}
            </Box>
        </Paper>
    );
}
