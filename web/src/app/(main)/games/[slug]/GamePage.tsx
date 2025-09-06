'use client';

import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Tab } from '@mui/material';
import { Game } from '@playbingo/types';
import { useLayoutEffect, useState } from 'react';
import GameSettings from '../../../../components/game/GameSettings';
import GoalCategories from '../../../../components/game/GoalCategories';
import PermissionsManagement from '../../../../components/game/PermissionsManagement';
import Variants from '../../../../components/game/Variants';
import GoalManagement from '../../../../components/game/goals/GoalManagement';
import { GoalManagerContextProvider } from '../../../../context/GoalManagerContext';
import { alertError } from '../../../../lib/Utils';
import GenerationPage from './Generation';
import Summary from './Summary';
import { grey } from '@mui/material/colors';

export default function GamePage({ gameData }: { gameData: Game }) {
    const [isOwner, setIsOwner] = useState(false);
    const [canModerate, setCanModerate] = useState(false);

    useLayoutEffect(() => {
        async function loadPermissions() {
            const res = await fetch(`/api/games/${gameData.slug}/permissions`);
            if (!res.ok) {
                if (res.status !== 401 && res.status !== 403) {
                    alertError('Unable to determine game permissions.');
                }
                return;
            }
            const permissions = await res.json();
            setIsOwner(permissions.isOwner);
            setCanModerate(permissions.canModerate);
        }
        loadPermissions();
    }, [gameData]);

    const tabs: string[] = [];
    if (
        gameData.descriptionMd ||
        gameData.setupMd ||
        gameData.linksMd ||
        (gameData.difficultyVariants?.length ?? 0) > 0
    ) {
        tabs.push('Overview');
    }
    tabs.push('Goals');
    if (canModerate) {
        tabs.push('Goal Categories');
    }
    if (isOwner) {
        if (gameData.difficultyVariantsEnabled) {
            tabs.push('Variants');
        }
        tabs.push('Permissions');
        if (gameData.newGeneratorBeta) {
            tabs.push('Generation');
        }
        tabs.push('Settings');
    }

    const [tab, setTab] = useState(tabs[0]);
    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTab(newValue);
    };

    return (
        <Box
            sx={{
                pt: 2,
                display: 'grid',
                gridTemplateRows: '50px 1fr',
                height: '100%',
                maxHeight: '100%',
                overflowY: 'auto',
                background: grey[900],
                px: 4,
            }}
        >
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
                <TabPanel value="Overview">
                    <Summary gameData={gameData} />
                </TabPanel>
                <TabPanel value="Goals">
                    <GoalManagerContextProvider
                        slug={gameData.slug}
                        canModerate={canModerate}
                    >
                        <GoalManagement />
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
                <TabPanel value="Generation">
                    <GenerationPage game={gameData} />
                </TabPanel>
                <TabPanel value="Settings">
                    <GameSettings gameData={gameData} />
                </TabPanel>
            </TabContext>
        </Box>
    );
}
