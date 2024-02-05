'use client';
import FormikTextField from '@/components/input/FormikTextField';
import LinkButton from '@/components/LinkButton';
import { useUserContext } from '@/context/UserContext';
import { Add } from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import { OAuthClient } from '@playbingo/types';
import { Form, Formik } from 'formik';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';

interface Props {
    applications: OAuthClient[];
}

export default function ApplicationsList({ applications }: Props) {
    const { loggedIn, current } = useUserContext();

    const [newDialogOpen, setNewDialogOpen] = useState(false);

    const router = useRouter();

    useLayoutEffect(() => {
        if (current && !loggedIn) {
            router.push('/');
        }
    });

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {applications.length > 0 &&
                    applications.map((app) => (
                        <LinkButton
                            component={NextLink}
                            href={`/developers/oauth/${app.id}`}
                            key={app.id}
                            sx={{
                                display: 'block',
                                width: 'fit-content',
                                textTransform: 'none',
                            }}
                        >
                            <Typography>{app.name}</Typography>
                            <Typography variant="caption">
                                {app.clientId}
                            </Typography>
                        </LinkButton>
                    ))}
                <Button
                    onClick={() => setNewDialogOpen(true)}
                    color="success"
                    startIcon={<Add />}
                >
                    Create Application
                </Button>
                {applications.length === 0 && (
                    <div className="text-sm italic">
                        You have no OAuth Applications.
                    </div>
                )}
            </Box>
            <Dialog
                open={newDialogOpen}
                onClose={() => setNewDialogOpen(false)}
            >
                <DialogTitle>Create new Application</DialogTitle>
                <Formik
                    initialValues={{ name: '' }}
                    onSubmit={async ({ name }) => {
                        const res = await fetch('/api/oauth/client', {
                            method: 'POST',
                            body: JSON.stringify({
                                name,
                            }),
                        });
                        if (!res.ok) {
                            //TODO: handle error
                            return;
                        }
                        const app = await res.json();
                        router.push(`/developers/oauth/${app.id}`);
                    }}
                >
                    <Form>
                        <DialogContent>
                            <FormikTextField name="name" label="Name" />
                        </DialogContent>
                        <DialogActions>
                            <Button
                                type="button"
                                onClick={() => setNewDialogOpen(false)}
                                color="error"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" color="success">
                                Submit
                            </Button>
                        </DialogActions>
                    </Form>
                </Formik>
            </Dialog>
        </>
    );
}
