import { RoomContext } from '@/context/RoomContext';
import { Box, Typography } from '@mui/material';
import { Sword } from 'mdi-material-ui';
import { useContext } from 'react';
import PlayerRaceSummary from './PlayerRaceSummary';

export default function PlayerList() {
    const {
        teams,
        spectators: allSpectators,
        roomData,
    } = useContext(RoomContext);

    const spectators = allSpectators.filter((player) => player.showInRoom);

    if (!roomData) {
        return null;
    }

    return (
        <>
            {teams.map((team) => {
                const members = team.players.filter(
                    (player) => player.showInRoom,
                );
                if (members.length === 0) {
                    return null;
                }
                return (
                    <Box
                        key={team.id}
                        sx={{
                            borderLeft: 6,
                            borderColor: team.color,
                            boxShadow: `0 0 6px ${team.color}`,
                            mb: 2,
                        }}
                    >
                        <Box
                            sx={{
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Typography sx={{ flexGrow: 1 }}>
                                {team.name}
                            </Typography>
                            <Typography>{team.goalCount}</Typography>
                        </Box>
                        {members.map((player) => (
                            <Box
                                key={player.id}
                                sx={{
                                    p: 1,
                                    ml: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Typography sx={{ flexGrow: 1 }}>
                                    {player.nickname}
                                </Typography>
                                <PlayerRaceSummary
                                    raceHandler={roomData.raceHandler}
                                    player={player}
                                />
                                {player.monitor && (
                                    <Sword
                                        fontSize="small"
                                        sx={{ color: 'green', ml: 2 }}
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
                                    <Typography>{player.nickname}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </>
            )}
        </>
    );
}
