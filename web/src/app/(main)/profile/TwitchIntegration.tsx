import { Box, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import { serverFetch } from '../../ServerUtils';

interface TwitchConnectionStatus {
    connected: boolean;
    twitchUser: string;
}

async function checkTwitchStatus(): Promise<TwitchConnectionStatus | false> {
    const res = await serverFetch('/api/connection/twitch');
    if (!res.ok) {
        return false;
    }
    const data = await res.json();
    return data;
}

export default async function TwitchIntegration() {
    const racetimeRes = await checkTwitchStatus();

    if (!racetimeRes) {
        return null;
    }

    const { connected, twitchUser } = racetimeRes;

    return (
        <div>
            <Typography variant="h6">Twitch</Typography>
            {!connected && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Link href={`/api/connect/twitch`} component={NextLink}>
                        Connect to Twitch
                    </Link>
                </Box>
            )}
            {connected && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        columnGap: 1,
                    }}
                >
                    <Typography>Connected as {twitchUser}</Typography>
                </Box>
            )}
        </div>
    );
}
