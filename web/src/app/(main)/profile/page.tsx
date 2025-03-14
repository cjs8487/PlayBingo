import { Box, Button, Container, Typography } from '@mui/material';
import { redirect } from 'next/navigation';
import RacetimeIntegration from './RacetimeIntegration';
import ProfileForm from './ProfileForm';
import { me } from '../../../actions/Session';
import ChangePassword from './ChangePassword';

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
                    Security
                </Typography>
                <ChangePassword />
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
