'use client';
import { Box } from '@mui/material';
import { Suspense } from 'react';
import Footer from '../../components/footer/Footer';
import Header from './_components/Header';

export default function DocsLayout({ children }: LayoutProps<'/docs'>) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
            }}
        >
            <Header />
            <Box
                sx={{
                    flexGrow: 1,
                }}
            >
                <Suspense fallback={<Box role="status">Loading...</Box>}>
                    {children}
                </Suspense>
            </Box>
            <Footer />
        </Box>
    );
}
