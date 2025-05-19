'use client';

import { Box, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';
import Login from '../../../components/Login';
import { UserContext } from '../../../context/UserContext';

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
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexGrow: 1,
            }}
        >
            <Paper sx={{ px: 8, py: 4 }}>
                <Login />
            </Paper>
        </Box>
    );
}
