'use client';
import { ChevronRight } from '@mui/icons-material';
import { Container, Drawer, IconButton, styled } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
}));

export default function GameSidebarStatisticsPage() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);

    const closeDrawer = () => {
        setOpen(false);
    };

    useEffect(() => {
        setOpen(true);
        setHasOpened(true);
    }, []);

    useEffect(() => {
        if (!open && hasOpened) {
            const timeout = setTimeout(() => {
                router.back();
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [open, hasOpened, router]);

    return (
        <Drawer
            sx={{
                top: 200,
                // width: 200,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    // width: 200,
                },
            }}
            variant="persistent"
            anchor="right"
            open={open}
        >
            <DrawerHeader>
                <IconButton onClick={closeDrawer}>
                    <ChevronRight />
                </IconButton>
            </DrawerHeader>
            <Container>Game statistics sidebar</Container>
        </Drawer>
    );
}
