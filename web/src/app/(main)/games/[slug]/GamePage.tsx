'use client';

import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Container, Link, Tab, Typography } from '@mui/material';
import { Game } from '@playbingo/types';
import Image from 'next/image';
import NextLink from 'next/link';
import { useLayoutEffect, useState } from 'react';
import GameSettings from '../../../../components/game/GameSettings';
import GoalCategories from '../../../../components/game/GoalCategories';
import PermissionsManagement from '../../../../components/game/PermissionsManagement';
import Variants from '../../../../components/game/Variants';
import GoalManagement from '../../../../components/game/goals/GoalManagement';
import { GoalManagerContextProvider } from '../../../../context/GoalManagerContext';
import { alertError, gameCoverUrl } from '../../../../lib/Utils';
import GenerationPage from './Generation';
import Summary from './Summary';

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
        <Container
            sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                pt: 2,
            }}
        >
            <Box sx={{ display: 'flex' }}>
                <Box
                    sx={{
                        position: 'fixed',
                        mr: 4,
                    }}
                >
                    {gameData.coverImage && (
                        <Image
                            src={gameCoverUrl(gameData.coverImage)}
                            alt=""
                            fill
                        />
                    )}
                    {!gameData.coverImage && (
                        <div>
                            <div>{gameData.slug}</div>
                        </div>
                    )}
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <Link component={NextLink} href={`/games/${gameData.slug}`}>
                        {gameData.slug}
                    </Link>
                    <Typography variant="h6">{gameData.name}</Typography>
                </Box>
                <Box
                    sx={{
                        minWidth: '30%',
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{ textDecoration: 'underline' }}
                    >
                        Owners
                    </Typography>
                    <Typography variant="body2">
                        {gameData.owners?.map((o) => o.username).join(', ')}
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ textDecoration: 'underline' }}
                    >
                        Moderators
                    </Typography>
                    <Typography variant="body2">
                        {gameData.moderators?.map((o) => o.username).join(', ')}
                    </Typography>
                </Box>
            </Box>
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
        </Container>
    );
}
