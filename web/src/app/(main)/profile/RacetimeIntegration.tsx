import NextLink from 'next/link';
import { alertError } from '../../../lib/Utils';
import { Box, Link, Typography } from '@mui/material';
import { serverFetch } from '../../ServerUtils';
import DiscconectButton from './DisconnectButton';
import { disconnectRacetime } from '../../../actions/Connection';

async function checkRacetimeStatus() {
    const res = await serverFetch('/api/connection/racetime');
    if (!res.ok) {
        alertError('Unable to retrieve racetime connection data.');
        return false;
    }
    const data = await res.json();
    return data;
}

export default async function RacetimeIntegration() {
    const { hasRacetimeConnection, racetimeUser } = await checkRacetimeStatus();

    return (
        <div>
            <Typography variant="h6">racetime.gg</Typography>
            {!hasRacetimeConnection && (
                <Box display="flex" alignItems="center">
                    <Link href={`/api/connect/racetime`} component={NextLink}>
                        Connect to racetime.gg
                    </Link>
                </Box>
            )}
            {hasRacetimeConnection && (
                <Box display="flex" alignItems="center" columnGap={1}>
                    <Typography>Connected as {racetimeUser}</Typography>
                    <DiscconectButton disconnect={disconnectRacetime} />
                </Box>
            )}
        </div>
    );
}
