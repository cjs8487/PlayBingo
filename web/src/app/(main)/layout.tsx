'use client';
import { Box, styled, useMediaQuery, useTheme } from '@mui/material';
import { ConfirmProvider } from 'material-ui-confirm';
import { ReactNode, useState } from 'react';
import CookieConsent from 'react-cookie-consent';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from '../../components/footer/Footer';
import Header from '../../components/header/Header';
import NavDrawer, { drawerWidth } from '../../components/header/NavDrawer';
import { useIsInRoom } from '../../hooks/useIsInRoom';

const Main = styled('main', {
    shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isInRoom',
})<{
    open?: boolean;
    isInRoom?: boolean;
}>(({ theme }) => ({
    flexGrow: 1,
    transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    variants: [
        {
            props: ({ open, isInRoom }) => open || isInRoom,
            style: {
                transition: theme.transitions.create('margin', {
                    easing: theme.transitions.easing.easeOut,
                    duration: theme.transitions.duration.enteringScreen,
                }),
                marginLeft: 0,
            },
        },
    ],
    display: 'grid',
    gridTemplateRows: '1fr auto',
    gridRow: '2',
    gridColumn: '2',
}));

export default function CoreLayout({
    children,
    modal,
}: {
    children: ReactNode;
    modal: ReactNode;
}) {
    const theme = useTheme();
    const isLg = useMediaQuery(theme.breakpoints.up('lg'));
    const isInRoom = useIsInRoom();

    const [manuallyOpened, setManuallyOpened] = useState(false);

    const navDrawerOpen = (!isInRoom && isLg) || manuallyOpened;

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
                    <Box sx={{ display: 'flex' }}>
                        <NavDrawer open={navDrawerOpen} />
                        <Main open={navDrawerOpen} isInRoom={isInRoom}>
                            {children}
                            <Footer />
                        </Main>
                    </Box>
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
