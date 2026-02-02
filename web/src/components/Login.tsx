'use client';
import logo from '@/images/playbingologo.png';
import {
    HubTwoTone as Hub,
    LockTwoTone as Lock,
    SportsEsportsTwoTone as SportsEsports,
    SyncTwoTone as Sync,
} from '@mui/icons-material';
import { Box, Button, Link, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import Image from 'next/image';
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
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Box
                sx={{
                    p: 2,
                    flexGrow: 1,
                }}
            >
                <Box sx={{ mb: 1, textAlign: 'center' }}>
                    <Image src={logo} alt="PlayBingo logo" height={52} />
                </Box>
                <Typography
                    variant="body1"
                    sx={{
                        color: 'text.secondary',
                        textAlign: 'center',
                        mb: 2,
                    }}
                >
                    Login is never required to play bingo.
                </Typography>
                <Box sx={{ p: 2 }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 2,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                mb: 2,
                            }}
                        >
                            <SportsEsports
                                color="primary"
                                fontSize="large"
                                sx={{ mr: 1, mt: 0.5 }}
                            />
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: 'medium',
                                        mb: 0.5,
                                    }}
                                >
                                    Game Management
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Create and manage your own bingo games, no
                                    coding required!
                                </Typography>
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                mb: 2,
                            }}
                        >
                            <Hub
                                color="primary"
                                fontSize="large"
                                sx={{ mr: 1, mt: 0.5 }}
                            />
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: 'medium',
                                        mb: 0.5,
                                    }}
                                >
                                    Connect with Services
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Integrate with external platforms like
                                    racetime.gg for enhanced bingo experiences
                                </Typography>
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                mb: 2,
                            }}
                        >
                            <Sync
                                color="primary"
                                fontSize="large"
                                sx={{ mr: 1, mt: 0.5 }}
                            />
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: 'medium',
                                        mb: 0.5,
                                    }}
                                >
                                    Sync Across Devices
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Seamlessly sync your preferences and game
                                    data across all your devices
                                </Typography>
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                mb: 2,
                            }}
                        >
                            <Lock
                                color="primary"
                                fontSize="large"
                                sx={{ mr: 1, mt: 0.5 }}
                            />
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: 'medium',
                                        mb: 0.5,
                                    }}
                                >
                                    Passwordless Room Entry
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Quickly rejoin rooms that you are already a
                                    part of without needing to re-enter the
                                    password
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ textAlign: 'right', mt: 2 }}>
                    <Link
                        href="/legal/privacy"
                        component={NextLink}
                        variant="caption"
                        color="text.secondary"
                    >
                        Privacy Policy
                    </Link>
                </Box>
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
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        rowGap: 2,
                        backgroundColor: 'background.paper',
                        p: 4,
                        boxShadow: 2,
                        minWidth: 300,
                    }}
                    component={Form}
                >
                    <FormikTextField
                        id="username"
                        name="username"
                        label="Username"
                    />
                    <Box sx={{ textAlign: 'right' }}>
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
                    <Button type="submit" variant="outlined" color="success">
                        Log In
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        New to PlayBingo?{' '}
                        <Link href="/register">Create an account</Link>
                    </Typography>
                </Box>
            </Formik>
        </Box>
    );
}
