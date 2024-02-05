import { Container, Typography } from '@mui/material';
import { OAuthClient } from '@playbingo/types';
import { serverGet } from '../../../ServerUtils';
import ApplicationsList from './_components/ApplicationsList';

async function getApplications(): Promise<OAuthClient[]> {
    const res = await serverGet(`/api/oauth/clients`);
    if (!res.ok) {
        //TODO: handle error
        return [];
    }
    return res.json();
}

export default async function OAuth() {
    const applications = await getApplications();

    return (
        <Container maxWidth="md" sx={{ mt: 2 }}>
            <Typography variant="h4">OAuth Applications</Typography>
            <ApplicationsList applications={applications} />
        </Container>
    );
}
