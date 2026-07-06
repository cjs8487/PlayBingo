import { RoomContext } from '@/context/RoomContext';
import { Box, Typography } from '@mui/material';
import { Sword } from 'mdi-material-ui';
import { useContext } from 'react';
import PlayerRaceSummary from './PlayerRaceSummary';

export default function PlayerList() {
    const { players: allPlayers, roomData } = useContext(RoomContext);

    const players = allPlayers.filter((p) => !p.spectator);
    const spectators = allPlayers.filter((p) => p.spectator);

    if (!roomData) {
        return null;
    }

    return (
        <>
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
        </>
    );
}
