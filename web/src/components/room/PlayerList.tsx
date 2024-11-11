import { useContext } from 'react';
import { RoomContext } from '../../context/RoomContext';
import { Box, Card, CardContent, CardHeader, Typography } from '@mui/material';
import { Duration } from 'luxon';

export default function PlayerList() {
    const { players, roomData, joinRacetimeRoom } = useContext(RoomContext);
    const racetimeConnected = !!roomData?.racetimeConnection?.url;

    return (
        <Card
            sx={{
                maxHeight: '100%',
                // overflowY: 'auto',
                py: 1,
            }}
        >
            <CardHeader
                title={`Connected Players (${players.length})`}
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ py: 0 }}
            />
            <CardContent sx={{ maxHeight: '80%', overflowY: 'auto' }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        rowGap: 1,
                        overflowY: 'auto',
                        maxHeight: '100%',
                    }}
                >
                    {players.map((player) => (
                        <Box key={player.nickname}>
                            <Box display="flex" columnGap={2}>
                                <Box
                                    px={0.5}
                                    style={{ background: player.color }}
                                    border={1}
                                    borderColor="divider"
                                >
                                    <Typography>{player.goalCount}</Typography>
                                </Box>
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
                </Box>
            </CardContent>
        </Card>
    );
}
