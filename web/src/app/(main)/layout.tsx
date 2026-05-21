'use client';
import { Box } from '@mui/material';
import { ConfirmProvider } from 'material-ui-confirm';
import { ReactNode, useState } from 'react';
import CookieConsent from 'react-cookie-consent';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from '../../components/footer/Footer';
import Header from '../../components/header/Header';
import NavDrawer from '../../components/header/NavDrawer';

export default function CoreLayout({
    children,
    modal,
}: {
    children: ReactNode;
    modal: ReactNode;
}) {
    const [manuallyOpened, setManuallyOpened] = useState(false);

    const navDrawerOpen = manuallyOpened;

    const toggleNavDrawer = () => {
        setManuallyOpened((curr) => !curr);
    };

    return (
        <>
            <ConfirmProvider>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gridTemplateRows: 'auto 1fr',
                        height: '100%',
                        maxHeight: '100%',
                        overflow: 'auto',
                    }}
                >
                    <Header toggleNavDrawer={toggleNavDrawer} />
                    <NavDrawer
                        open={navDrawerOpen}
                        setOpen={setManuallyOpened}
                    />
                    {children}
                    <Footer />
                </Box>
                <ToastContainer />
                {modal}
            </ConfirmProvider>
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
        </>
    );
}
