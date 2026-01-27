'use client';
import { Delete } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Typography,
} from '@mui/material';
import { OAuthClient } from '@playbingo/types';
import { FieldArray, Form, Formik } from 'formik';
import FormikTextField from '../../../../../../components/input/FormikTextField';
import CopyButton from './CopyButton';
import ClientSecret from './ClientSecret';

interface Props {
    id: string;
    application: OAuthClient;
}

export default function ApplicationForm({ id, application }: Props) {
    return (
        <Formik
            initialValues={{
                name: application.name,
                redirects: application.redirectUris,
            }}
            onSubmit={async ({ name, redirects }) => {
                const res = await fetch(`/api/oauth/${id}`, {
                    method: 'POST',
                    body: JSON.stringify({ name, redirects }),
                });
                if (!res.ok) {
                    //TODO: handle error
                    return;
                }
            }}
        >
            {({ values }) => (
                <Box
                    component={Form}
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                    }}
                >
                    <Card sx={{ gridColumn: 'span 2' }}>
                        <CardHeader title="Basic Information" sx={{ pb: 0 }} />
                        <CardContent>
                            <FormikTextField
                                name="name"
                                label="App Name"
                                size="small"
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader title="Client ID" sx={{ pb: 0 }} />
                        <CardContent>
                            <Typography variant="body2" sx={{ pb: 2 }}>
                                Your client id is your application&#39;s public
                                identifier, similar to your username.
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    pb: 2,
                                }}
                            >
                                <Typography>{application.clientId}</Typography>
                                <CopyButton value={application.clientId} />
                            </Box>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader title="Client Secret" sx={{ pb: 0 }} />
                        <CardContent>
                            <Typography variant="body2" sx={{ pb: 2 }}>
                                Your client secret is your application&#39;s
                                password and must be kept secret. You can only
                                see the secret once when it is generated.
                            </Typography>
                            <ClientSecret application={application} />
                        </CardContent>
                    </Card>
                    <Card sx={{ gridColumn: 'span 2' }}>
                        <CardHeader title="Redirects" sx={{ pb: 0 }} />
                        <CardContent>
                            <Typography variant="body2" sx={{ pb: 2 }}>
                                Specify where you want to send users after
                                authentication. At least one redirect URI is
                                required for authorization to work, and all
                                authorization requests must include a redirect
                                URI that exactly matches one of these.
                            </Typography>
                            <Box>
                                <FieldArray name="redirects">
                                    {({ push, remove }) => (
                                        <>
                                            {values.redirects.map(
                                                (_, index) => (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 1,
                                                            pb: 1,
                                                        }}
                                                    >
                                                        <FormikTextField
                                                            name={`redirects.${index}`}
                                                            label=""
                                                            size="small"
                                                        />
                                                        <IconButton
                                                            onClick={() =>
                                                                remove(index)
                                                            }
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </Box>
                                                ),
                                            )}
                                            <Button
                                                type="button"
                                                onClick={() => push('')}
                                            >
                                                Add
                                            </Button>
                                        </>
                                    )}
                                </FieldArray>
                            </Box>
                        </CardContent>
                    </Card>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gridColumn: 'span 2',
                        }}
                    >
                        <Button color="success" type="submit">
                            Save
                        </Button>
                    </Box>
                </Box>
            )}
        </Formik>
    );
}
