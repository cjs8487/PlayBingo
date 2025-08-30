import { Box, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import { disconnectRacetime } from '../../../actions/Connection';
import DisconnectButton from './DisconnectButton';
import { serverFetch } from '../../ServerUtils';

interface RacetimeConnectionStatus {
    hasRacetimeConnection: boolean;
    racetimeUser: string;
}

async function checkRacetimeStatus(): Promise<
    RacetimeConnectionStatus | false
> {
    const res = await serverFetch('/api/connection/racetime');
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
        <div>
            <Typography variant="h6">racetime.gg</Typography>
            {!hasRacetimeConnection && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Link href={`/api/connect/racetime`} component={NextLink}>
                        Connect to racetime.gg
                    </Link>
                </Box>
            )}
            {hasRacetimeConnection && (
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
            )}
        </div>
    );
}
