'use client';

import { useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';
import { UserContext } from '../../../context/UserContext';
import FormikTextField from '../../../components/input/FormikTextField';
import { Box, Button, Link, Paper, Typography } from '@mui/material';
import { login } from '../../../actions/Session';
import Login from '../../../components/Login';

export default function LoginPage() {
    const router = useRouter();

    const { user } = useContext(UserContext);

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexGrow={1}
        >
            <Paper sx={{ px: 8, py: 4 }}>
                <Login />
            </Paper>
        </Box>
    );
}
