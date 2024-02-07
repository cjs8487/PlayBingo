'use client';
import { Delete } from '@mui/icons-material';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { OAuthClient } from '@playbingo/types';
import { FieldArray, Form, Formik } from 'formik';
import FormikTextField from '../../../../../../components/input/FormikTextField';
import CopyButton from './CopyButton';

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
                <Form>
                    <Box sx={{ pb: 5 }} className="pb-10">
                        <Typography variant="h5" sx={{ pb: 2 }}>
                            Basic Info
                        </Typography>
                        <FormikTextField
                            name="name"
                            label="App Name"
                            size="small"
                        />
                    </Box>
                    <Box sx={{ pb: 5 }}>
                        <Typography variant="h5" sx={{ pb: 2 }}>
                            Client Information
                        </Typography>
                        <Box
                            sx={{ display: 'flex', gap: 6 }}
                            className="flex gap-x-6"
                        >
                            <Box sx={{ maxWidth: '50%', flexBasis: '50%' }}>
                                <Typography variant="h6">Client ID</Typography>
                                <Typography variant="body2" sx={{ pb: 2 }}>
                                    Your client id is your application&#39;s
                                    public identifier, similar to your username.
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        pb: 2,
                                    }}
                                >
                                    <Typography>
                                        {application.clientId}
                                    </Typography>
                                    <CopyButton value={application.clientId} />
                                </Box>
                            </Box>
                            <Box sx={{ maxWidth: '50%', flexBasis: '50%' }}>
                                <Typography variant="h6">
                                    Client Secret
                                </Typography>
                                <Typography variant="body2" sx={{ pb: 2 }}>
                                    Your client secret is your application&#39;s
                                    password and must be kept secret. You can
                                    only see the secret once when it is
                                    generated.
                                </Typography>
                                <Button>Reset</Button>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ pb: 1 }} className="pb-3">
                        <Typography variant="h6">Redirects</Typography>
                        <Typography variant="body2" sx={{ pb: 2 }}>
                            Specify where you want to send users after
                            authentication. At least one redirect URI is
                            required for authorization to work, and all
                            authorization requests must include a redirect URI
                            that exactly matches one of these.
                        </Typography>
                        <Box sx={{ pb: 2 }}>
                            <FieldArray name="redirects">
                                {({ push, remove }) => (
                                    <>
                                        {values.redirects.map((_, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
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
                                        ))}
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
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button color="success">Save</Button>
                    </Box>
                </Form>
            )}
        </Formik>
    );
}
