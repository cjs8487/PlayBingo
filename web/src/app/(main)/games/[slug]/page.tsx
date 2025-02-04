'use client';

import { useApi } from '@/lib/Hooks';
import Info from '@mui/icons-material/Info';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Container, Link, Tab, Typography } from '@mui/material';
import { Game } from '@playbingo/types';
import Image from 'next/image';
import NextLink from 'next/link';
import { use, useLayoutEffect, useState } from 'react';
import GameSettings from '../../../../components/game/GameSettings';
import GoalCategories from '../../../../components/game/GoalCategories';
import GoalManagement from '../../../../components/game/goals/GoalManagement';
import PermissionsManagement from '../../../../components/game/PermissionsManagement';
import Variants from '../../../../components/game/Variants';
import HoverIcon from '../../../../components/HoverIcon';
import { GoalManagerContextProvider } from '../../../../context/GoalManagerContext';
import { alertError, gameCoverUrl } from '../../../../lib/Utils';

export default function GamePage(props: { params: Promise<{ slug: string }> }) {
    const params = use(props.params);

    const { slug } = params;

    const { data: gameData, isLoading } = useApi<Game>(`/api/games/${slug}`);

    const [isOwner, setIsOwner] = useState(false);
    const [canModerate, setCanModerate] = useState(false);
    const [tab, setTab] = useState('Goals');
    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setTab(newValue);
    };

    useLayoutEffect(() => {
        async function loadPermissions() {
            const res = await fetch(`/api/games/${slug}/permissions`);
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
    }, [slug]);

    if (!gameData || isLoading) {
        return null;
    }

    const tabs = ['Goals'];
    if (canModerate) {
        tabs.push('Goal Categories');
    }
    if (isOwner) {
        if (gameData.difficultyVariantsEnabled) {
            tabs.push('Variants');
        }
        tabs.push('Permissions');
        tabs.push('Generation');
        tabs.push('Settings');
    }

    return (
        <Container
            sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                pt: 2,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                }}
            >
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
                            <div>{slug}</div>
                        </div>
                    )}
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <Link component={NextLink} href={`/games/${slug}`}>
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
                <TabPanel
                    value="Goals"
                    sx={{
                        display: tab === 'Goals' ? 'flex' : 'none',
                        flexGrow: 1,
                    }}
                >
                    <GoalManagerContextProvider
                        slug={slug}
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
                    <PermissionsManagement slug={slug} gameData={gameData} />
                </TabPanel>
                <TabPanel value="Generation">
                    <Typography
                        variant="h5"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            columnGap: 1,
                        }}
                    >
                        List Selection
                        <HoverIcon icon={<Info />}>
                            <Typography variant="body2">
                                List Selection is the first step in the board
                                generation process, where the generator prunes
                                the full list of goals based on the selected
                                criteria.
                            </Typography>
                        </HoverIcon>
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            columnGap: 1,
                        }}
                    >
                        Goal Transformation
                        <HoverIcon icon={<Info />}>
                            <Typography variant="body2">
                                Goal Transformation applies transformation to
                                the data stored in a goal before generation.
                                Transformation can include selecting modified
                                values for the goal, altering the difficulty, or
                                even translating into a different language.
                            </Typography>
                        </HoverIcon>
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            columnGap: 1,
                        }}
                    >
                        Board Layout
                        <HoverIcon icon={<Info />}>
                            <Typography variant="body2">
                                The board layout step determines how goals are
                                laid out on the board. The layout chosen here
                                restricts what goals can be chosen for each cell
                                in later steps.
                                <ul>
                                    <li>
                                        Random generates a board layout that has
                                        no restrictions on what goals can be
                                        placed in any given cell
                                    </li>
                                    <li>
                                        Magic Square generates a board using
                                        difficulties 1-25 to balance each line.
                                        Each difficulty appears on the board
                                        exactly once, and the sum of the
                                        difficulties in each line sumas to the
                                        same value. Using magic square layout
                                        requires the use of goal difficulties,
                                        and any goals without a valid difficulty
                                        value will be ignored.
                                    </li>
                                    <li>
                                        Static (Isaac) generates a board using a
                                        static difficulty layout from 1-4. The
                                        center cell is a goal with a difficulty
                                        of 4, and all lines using the cell sum
                                        to 10. All other lines sum to 9. Goals
                                        with an invalid difficulty will not be
                                        selected.
                                    </li>
                                </ul>
                            </Typography>
                        </HoverIcon>
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            columnGap: 1,
                        }}
                    >
                        Goal Selection
                        <HoverIcon icon={<Info />}>
                            <Typography variant="body2" component="div">
                                Goal Selection determines the process by which
                                goals are selected from the pool of possible
                                goals for placement onto the board. The
                                selection mode determines how the board layout
                                is interpreted by the generator in order to
                                select goals.
                                <ul>
                                    <li>
                                        Random selection selects goals
                                        completely at random. This is the only
                                        selection mode that is compatible with a
                                        random board layout. Random selection is
                                        not compatible with magic square or
                                        static board layouts
                                    </li>
                                    <li>
                                        Difficulty selection selects goals based
                                        on their difficulty value - the value in
                                        the board layout will indicate what
                                        difficulty the generator will place in
                                        that cell. Difficulty selection is not
                                        compatible with random board layouts.
                                    </li>
                                </ul>
                            </Typography>
                        </HoverIcon>
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            columnGap: 1,
                        }}
                    >
                        Cell Restrictions
                        <HoverIcon icon={<Info />}>
                            <Typography variant="body2" component="div">
                                Cell restrictions restrict which otherwise valid
                                goals cannot be placed in a specific cell, based
                                on properties of that cell, such as what other
                                goals it shares a line with.
                                <ul>
                                    <li>
                                        Line type exclusion utilizes goal
                                        categories to minimize synergy in every
                                        line by minimizing the total overlap of
                                        categories in the line. This restriction
                                        guarantees that a goal with the minimum
                                        overlap with already placed goals will
                                        be placed in each cell.
                                    </li>
                                </ul>
                            </Typography>
                        </HoverIcon>
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            columnGap: 1,
                        }}
                    >
                        Global Adjustments
                        <HoverIcon icon={<Info />}>
                            <Typography variant="body2" component="div">
                                Global adjustments are steps taken after a goal
                                is placed, which alter the goal list in some
                                way, affecting the placement of all future
                                goals.
                                <ul>
                                    <li>
                                        Synergize will increase the likelihood
                                        of a goal sharing one or more types with
                                        already placed goals being selected.
                                        After each goal is placed, the remaining
                                        goals that share a type will duplicated,
                                        resulting in a 2x chance of selection.
                                        Goals that share multiple types will
                                        have an even higher chance of selection
                                    </li>
                                    <li>
                                        Board type maximum restrictions contrain
                                        the board to having a maximum number of
                                        goals of a specific type. After a goal
                                        is placed, if any type has met it's
                                        maximum, all goals with that type will
                                        be removed from the goal pool,
                                        preventing any more from being placed.
                                    </li>
                                </ul>
                            </Typography>
                        </HoverIcon>
                    </Typography>
                </TabPanel>
                <TabPanel value="Settings">
                    <GameSettings gameData={gameData} />
                </TabPanel>
            </TabContext>
        </Container>
    );
}
