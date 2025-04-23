import { Box, Container, Typography } from '@mui/material';
import { redirect } from 'next/navigation';
import { serverGet } from '../../ServerUtils';
import ChangePassword from './ChangePassword';
import ProfileForm from './ProfileForm';
import RacetimeIntegration from './RacetimeIntegration';

async function getUser() {
    const res = await serverGet('/api/me');

    if (!res.ok) {
        return false;
    }
    return res.json();
}

export default async function ProfilePage() {
    const user = await getUser();

    console.log(user);

    if (!user) {
        redirect('/');
    }

    return (
        <Container>
            <Typography variant="h4" sx={{
                mb: 2
            }}>
                {user.username}
            </Typography>
            <Typography variant="h5" sx={{
                mb: 1
            }}>
                Account Info
            </Typography>
            <ProfileForm />
            <Box sx={{
                mb: 3
            }}>
                <Typography variant="h6" sx={{
                    mb: 1
                }}>
                    Security
                </Typography>
                <ChangePassword />
            </Box>
            <Box>
                <Typography variant="h5" sx={{
                    mb: 1
                }}>
                    Integrations
                </Typography>
                <RacetimeIntegration />
            </Box>
        </Container>
    );
}
