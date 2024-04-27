import { Box, Container, Typography } from '@mui/material';
import { redirect } from 'next/navigation';
import RacetimeIntegration from './RacetimeIntegration';
import { serverFetch } from '../../ServerUtils';

async function getUser() {
    const res = await serverFetch('/api/me');

    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

export default async function ProfilePage() {
    const user = await getUser();

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
            <Formik initialValues={{}} onSubmit={() => {}}>
                <Form>
                    <Box display="flex" flexDirection="column" rowGap={1}>
                        <FormikTextField
                            id="username"
                            name="username"
                            label="Username"
                            size="small"
                        />
                        <FormikTextField
                            id="email"
                            name="email"
                            label="Email"
                            size="small"
                        />
                        <Box display="flex">
                            <Box flexGrow={1} />
                            <Button className="rounded-md bg-green-700 px-2 py-1">
                                Update
                            </Button>
                        </Box>
                    </Box>
                </Form>
            </Formik>
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
