'use client';
import { Box, Button, Link, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login } from '../actions/Session';
import { useUserContext } from '../context/UserContext';
import FormikTextField from './input/FormikTextField';

interface LoginProps {
    useRouterBack?: boolean;
}

export default function Login({ useRouterBack }: LoginProps) {
    const { checkSession } = useUserContext();

    const [error, setError] = useState('');

    const router = useRouter();

    return (
        <>
            <Box
                sx={{
                    paddingBottom: 2,
                    textAlign: 'center',
                }}
            >
                <Typography variant="h4">Login to PlayBingo</Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                    }}
                >
                    No login is required to play bingo.
                </Typography>
                {error && (
                    <Typography variant="body2" color="error">
                        {error}
                    </Typography>
                )}
            </Box>
            <Formik
                initialValues={{ username: '', password: '' }}
                onSubmit={async ({ username, password }) => {
                    const res = await login(username, password);
                    if (!res.ok) {
                        if (res.status === 401) {
                            setError('Incorrect username or password.');
                        } else {
                            setError(
                                'An error occurred while processing your request.',
                            );
                        }
                        return;
                    }
                    await checkSession();
                    if (useRouterBack) {
                        router.back();
                    } else {
                        router.push('/');
                    }
                }}
            >
                <Form>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            rowGap: 2,
                        }}
                    >
                        <FormikTextField
                            id="username"
                            name="username"
                            label="Username"
                        />
                        <Box>
                            <FormikTextField
                                id="password"
                                name="password"
                                label="Password"
                                type="password"
                                autoComplete="current-password"
                                fullWidth
                            />
                            <Link
                                href="/forgotpass"
                                component={NextLink}
                                variant="caption"
                            >
                                Forgot password?
                            </Link>
                        </Box>
                        <Box
                            sx={{
                                textAlign: 'right',
                            }}
                        >
                            <Button href="/register" component={NextLink}>
                                Register
                            </Button>
                            <Button type="submit" variant="contained">
                                Log In
                            </Button>
                        </Box>
                    </Box>
                </Form>
            </Formik>
        </>
    );
}
