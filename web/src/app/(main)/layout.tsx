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
                display: 'grid',
                gridTemplateColumns: '1fr',
                gridTemplateRows: 'auto 1fr auto',
                height: '100%',
                maxHeight: '100%',
                overflow: 'auto',
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
            {children}
            <Footer />
            <ToastContainer />
            {modal}
        </Box>
    );
}
