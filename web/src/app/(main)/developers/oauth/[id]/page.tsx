import { OAuthClient } from '@playbingo/types';
import { notFound } from 'next/navigation';
import { serverGet } from '../../../../ServerUtils';
import ApplicationForm from './_components/ApplicationForm';
import { Container, Typography } from '@mui/material';

async function getApplication(id: string): Promise<OAuthClient | undefined> {
    const res = await serverGet(`/api/oauth/${id}`);

    if (!res.ok) {
        if (res.status === 404) {
            notFound();
        }
        return undefined;
    }
    return res.json();
}

export default async function OAuthApplication({
    params,
}: PageProps<'/developers/oauth/[id]'>) {
    const { id } = await params;
    const application = await getApplication(id);

    if (!application) {
        return null;
    }

    return (
        <Container className="flex justify-center" sx={{ mt: 2 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
                Edit OAuth Application
            </Typography>
            <ApplicationForm id={id} application={application} />
        </Container>
    );
}
