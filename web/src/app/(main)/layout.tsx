'use client';
import { Box } from '@mui/material';
import { ReactNode } from 'react';
import CookieConsent from 'react-cookie-consent';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from '../../components/footer/Footer';
import Header from '../../components/header/Header';

export default function CoreLayout({
    children,
    modal,
}: {
    children: ReactNode;
    modal: ReactNode;
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
            }}
        >
            <Header />
            <CookieConsent
                location="bottom"
                buttonText="I understand"
                buttonStyle={{
                    background: '#8c091b',
                    color: '#fbfbfb',
                    fontSize: '13px',
                }}
            >
                This website uses cookies to provide some parts of its
                functionality.
            </CookieConsent>
            <Box
                sx={{
                    flexGrow: 1,
                    height: '100%',
                    display: 'flex',
                }}
            >
                {children}
            </Box>
            <Footer />
            <ToastContainer />
            {modal}
        </Box>
    );
}
