'use client';
import { Box, Button, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useRouter } from 'next/navigation';
import { useContext, useLayoutEffect } from 'react';
import * as yup from 'yup';
import FormikFileUpload from '../../../../components/input/FileUpload';
import FormikTextField from '../../../../components/input/FormikTextField';
import { UserContext } from '../../../../context/UserContext';
import { alertError } from '../../../../lib/Utils';

const newGameValidationSchema = yup.object().shape({
    name: yup.string().required('Game name is required'),
    slug: yup
        .string()
        .required('Game slug is required')
        .min(2, 'Slugs must be at least 5 characters')
        .max(8, 'Slugs cannot be longer than 8 characters'),
    coverImage: yup.string(),
});

export default function NewGame() {
    const { loggedIn } = useContext(UserContext);
    const router = useRouter();

    useLayoutEffect(() => {
        if (!loggedIn) {
            router.push('/');
        }
    });
    if (!loggedIn) {
        return null;
    }

    return (
        <Box
            sx={{
                flexGrow: 1,
                px: 4,
                width: '100%',
            }}
        >
            <Typography
                variant="h4"
                align="center"
                sx={{
                    py: 2,
                }}
            >
                Create a new game
            </Typography>
            <Formik
                initialValues={{ name: '', slug: '', coverImage: '' }}
                validationSchema={newGameValidationSchema}
                onSubmit={async (values) => {
                    console.log(values);
                    const res = await fetch('/api/games', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(values),
                    });
                    if (!res.ok) {
                        const error = await res.text();
                        alertError(`Unable to create game - ${error}`);
                        return;
                    }
                    router.push(`/games/${values.slug}`);
                }}
            >
                <Form>
                    <Box
                        sx={{
                            display: 'flex',
                            columnGap: 2,
                            height: 'fit-content',
                        }}
                    >
                        <Box
                            sx={{
                                flexGrow: 1,
                                height: '100%',
                                maxWidth: '33%',
                            }}
                        >
                            <FormikFileUpload
                                name="coverImage"
                                workflow="game"
                            />
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                rowGap: 1,
                                flexGrow: 1,
                            }}
                        >
                            <FormikTextField
                                id="game-name"
                                name="name"
                                label="Game Name"
                            />
                            <FormikTextField
                                id="game-slug"
                                name="slug"
                                label="Slug"
                            />
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ flexGrow: 1 }} />
                                <Button type="submit">Submit</Button>
                            </Box>
                        </Box>
                    </Box>
                </Form>
            </Formik>
        </Box>
    );
}
