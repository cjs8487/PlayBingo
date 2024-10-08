import { Box, Button, Container, Typography } from '@mui/material';
import { redirect } from 'next/navigation';
import { serverFetch } from '../../ServerUtils';
import RacetimeIntegration from './RacetimeIntegration';
import ProfileForm from './ProfileForm';
import { me } from '../../../actions/Session';

async function getUser() {
    const res = await serverFetch('/api/me');

    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

export default async function ProfilePage() {
    const { ok, user } = await me();

    if (!user) {
        redirect('/');
    }

    return (
        <Container>
            <Typography variant="h4" mb={2}>
                {user.username}
            </Typography>
            <Typography variant="h5" mb={1}>
                Account Info
            </Typography>
            <ProfileForm user={user} />
            <Box mb={3}>
                <Typography variant="h6" mb={1}>
                    Password
                </Typography>
                <Button color="error" variant="outlined">
                    Change Password
                </Button>
                <Box>
                    <Typography variant="caption">
                        Changing your password will end all login sessions.
                    </Typography>
                </Box>
            </Box>
            <Box>
                <Typography variant="h5" mb={1}>
                    Integrations
                </Typography>
                <RacetimeIntegration />
            </Box>
        </Container>
    );
}
