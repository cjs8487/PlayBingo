import { Box, Paper, Typography } from '@mui/material';
import { Sword } from 'mdi-material-ui';
import { useContext } from 'react';
import { RoomContext } from '../../context/RoomContext';
import PlayerRaceSummary from './PlayerRaceSummary';
export default function PlayerList() {
    const {
        teams,
        spectators: allSpectators,
        roomData,
    } = useContext(RoomContext);
    const players = teams
        .flatMap((team) => team.players)
        .filter((player) => player.showInRoom);
    const spectators = allSpectators.filter((player) => player.showInRoom);

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
                {teams.map((team) => {
                    const members = team.players.filter(
                        (player) => player.showInRoom,
                    );
                    if (members.length === 0) {
                        return null;
                    }
                    return (
                        <Box key={team.id}>
                            <Box sx={{ display: 'flex', columnGap: 2 }}>
                                <Box
                                    style={{ background: team.color }}
                                    sx={{
                                        px: 0.5,
                                        border: 1,
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Typography>{team.goalCount}</Typography>
                                </Box>
                                {roomData?.teamsEnabled && (
                                    <Typography>{team.name}</Typography>
                                )}
                                {!roomData?.teamsEnabled &&
                                    members.length === 1 && (
                                        <>
                                            {members[0].monitor && (
                                                <Sword
                                                    fontSize="small"
                                                    sx={{ color: 'green' }}
                                                />
                                            )}
                                            <Typography>
                                                {members[0].nickname}
                                            </Typography>
                                        </>
                                    )}
                            </Box>
                            {members.map((player) => (
                                <Box
                                    key={player.id}
                                    sx={{ pl: roomData?.teamsEnabled ? 2 : 0 }}
                                >
                                    {(roomData?.teamsEnabled ||
                                        members.length > 1) && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                columnGap: 2,
                                            }}
                                        >
                                            {player.monitor && (
                                                <Sword
                                                    fontSize="small"
                                                    sx={{ color: 'green' }}
                                                />
                                            )}
                                            <Typography>
                                                {player.nickname}
                                            </Typography>
                                        </Box>
                                    )}
                                    {roomData?.raceHandler && (
                                        <PlayerRaceSummary
                                            raceHandler={roomData.raceHandler}
                                            player={player}
                                        />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    );
                })}
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
                                <Box key={player.id}>
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
