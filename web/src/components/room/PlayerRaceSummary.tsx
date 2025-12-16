import { Box, Typography } from '@mui/material';
import { Player, RoomData } from '@playbingo/types';
import { DateTime, Duration } from 'luxon';
import { useRoomContext } from '../../context/RoomContext';

interface Props {
    raceHandler: RoomData['raceHandler'];
    player: Player;
}

export default function PlayerRaceSummary({ raceHandler, player }: Props) {
    if (!player.raceStatus) {
        return null;
    }

    switch (raceHandler) {
        case 'racetime':
            return <PlayerSummaryRacetime player={player} />;
        case 'local':
            return <PlayerSummaryLocal player={player} />;
    }
}

function PlayerSummaryRacetime({ player }: Omit<Props, 'raceHandler'>) {
    return (
        <Box>
            {player.raceStatus?.connected ? (
                <Typography>
                    {player.raceStatus.username} -{' '}
                    {player.raceStatus.ready ? 'Ready' : 'Not ready'}
                    {player.raceStatus.finishTime &&
                        ` - ${Duration.fromISO(player.raceStatus.finishTime).toFormat('h:mm:ss')}`}
                </Typography>
            ) : (
                <Typography>Not connected</Typography>
            )}
        </Box>
    );
}
function PlayerSummaryLocal({ player }: Omit<Props, 'raceHandler'>) {
    const { roomData } = useRoomContext();

    if (!roomData || !roomData.startedAt || !player.raceStatus.connected) {
        return null;
    }

    const startDt = DateTime.fromISO(roomData.startedAt);

    if (!player.raceStatus.finishTime) {
        return <Typography sx={{ mt: 1 }}>Not finished</Typography>;
    }
    const finishDt = DateTime.fromISO(player.raceStatus.finishTime);

    return (
        <Box sx={{ mt: 1 }}>
            {player.raceStatus?.connected && player.raceStatus.finishTime ? (
                <Typography>
                    {finishDt.diff(startDt).toFormat('h:mm:ss')}
                </Typography>
            ) : null}
        </Box>
    );
}
