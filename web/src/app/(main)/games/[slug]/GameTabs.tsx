'use client';

import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Tab } from '@mui/material';
import { ReactNode, useState } from 'react';
import GoalCategories from '../../../../components/game/GoalCategories';
import PermissionsManagement from '../../../../components/game/PermissionsManagement';
import Variants from '../../../../components/game/Variants';
import { GoalManagerContextProvider } from '../../../../context/GoalManagerContext';
import { Game } from '../../../../types/Game';

interface GameTabsProps {
    gameData: Game;
    canModerate: boolean;
    isOwner: boolean;
    goals: ReactNode;
    settings: ReactNode;
    permissions: ReactNode;
}

export default function GameTabs({
    gameData,
    canModerate,
    isOwner,
    goals,
    settings,
    permissions,
}: GameTabsProps) {
    const [tab, setTab] = useState('Goals');
    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTab(newValue);
    };

    const tabs = ['Goals'];
    if (canModerate) {
        tabs.push('Goal Categories');
    }
    if (isOwner) {
        if (gameData.difficultyVariantsEnabled) {
            tabs.push('Variants');
        }
        tabs.push('Permissions');
        tabs.push('Settings');
    }

    return (
        <TabContext value={tab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList
                    onChange={handleChange}
                    aria-label="lab API tabs example"
                >
                    {tabs.map((tab) => (
                        <Tab key={tab} label={tab} value={tab} />
                    ))}
                </TabList>
            </Box>
            <TabPanel
                value="Goals"
                sx={{
                    display: tab === 'Goals' ? 'flex' : 'none',
                    flexGrow: 1,
                }}
            >
                <GoalManagerContextProvider
                    slug={gameData.slug}
                    canModerate={canModerate}
                >
                    {goals}
                </GoalManagerContextProvider>
            </TabPanel>
            <TabPanel value="Goal Categories">
                <GoalCategories gameData={gameData} />
            </TabPanel>
            <TabPanel value="Variants">
                <Variants gameData={gameData} />
            </TabPanel>
            <TabPanel value="Permissions">
                <PermissionsManagement
                    slug={gameData.slug}
                    gameData={gameData}
                />
            </TabPanel>
            <TabPanel value="Settings">{settings}</TabPanel>
        </TabContext>
    );
}
