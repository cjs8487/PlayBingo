import { Box, Paper, Typography } from '@mui/material';
import { Sword } from 'mdi-material-ui';
import { useContext } from 'react';
import { RoomContext } from '../../context/RoomContext';
import PlayerRaceSummary from './PlayerRaceSummary';
export default function PlayerList() {
    const { players: allPlayers, roomData } = useContext(RoomContext);

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
                {players
                    .filter((player) => player.showInRoom)
                    .map((player) => (
                        <Box key={player.id}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    columnGap: 2,
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
                            {roomData?.raceHandler && (
                                <PlayerRaceSummary
                                    raceHandler={roomData.raceHandler}
                                    player={player}
                                />
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
