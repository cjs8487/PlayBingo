'use client';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Container, Typography, Box, Tab } from '@mui/material';
import { notFound } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { useUserContext } from '../../../context/UserContext';

interface StaffDashboardLayoutProps {
    logs: ReactNode;
    games: ReactNode;
    tokens: ReactNode;
}

export default function StaffDashboardLayout({
    logs,
    games,
    tokens,
}: StaffDashboardLayoutProps) {
    const { user, loggedIn } = useUserContext();

    const [tab, setTab] = useState('Logs');
    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTab(newValue);
    };

    if (!loggedIn || !user || !user.staff) {
        notFound();
    }

    const tabs = ['Logs', 'Games', 'Tokens'];

    return (
        <Container
            sx={{
                pt: 2,
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Typography variant="h4" sx={{
                textAlign: "center"
            }}>
                Staff Dashboard
            </Typography>
            <TabContext value={tab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={handleChange}>
                        {tabs.map((tab) => (
                            <Tab key={tab} label={tab} value={tab} />
                        ))}
                    </TabList>
                </Box>
                <TabPanel value="Logs" sx={{ flexGrow: 1 }}>
                    {logs}
                </TabPanel>
                <TabPanel value="Games" sx={{ flexGrow: 1 }}>
                    {games}
                </TabPanel>
                <TabPanel value="Tokens" sx={{ flexGrow: 1 }}>
                    {tokens}
                </TabPanel>
            </TabContext>
        </Container>
    );
}
