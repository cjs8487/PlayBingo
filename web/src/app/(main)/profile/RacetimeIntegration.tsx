import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';
import rt from '../../../images/rt.png';
import { disconnectRacetime } from '../../../actions/Connection';
import { serverGet } from '../../ServerUtils';
import DisconnectButton from './DisconnectButton';

interface RacetimeConnectionStatus {
    hasRacetimeConnection: boolean;
    racetimeUser: string;
}

async function checkRacetimeStatus(): Promise<
    RacetimeConnectionStatus | false
> {
    const res = await serverGet('/api/connection/racetime');
    if (!res.ok) {
        return false;
    }
    const data = await res.json();
    return data;
}

export default async function RacetimeIntegration() {
    const racetimeRes = await checkRacetimeStatus();

    if (!racetimeRes) {
        return null;
    }

    const { hasRacetimeConnection, racetimeUser } = racetimeRes;

    return (
        <>
            {!hasRacetimeConnection && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Button
                        href={`/api/connect/racetime`}
                        sx={{ gap: 1 }}
                        variant="contained"
                        color="inherit"
                    >
                        <Image
                            src={rt}
                            alt="racetime.gg"
                            height={20}
                            width={20}
                        />
                        Connect to racetime.gg
                    </Button>
                </Box>
            )}
            {hasRacetimeConnection && (
                <>
                    <Typography variant="h6">racetime.gg</Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            columnGap: 1,
                        }}
                    >
                        <Typography>Connected as {racetimeUser}</Typography>
                        <DisconnectButton disconnect={disconnectRacetime} />
                    </Box>
                </>
            )}
        </>
    );
}
