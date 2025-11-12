import { Box, LinearProgress, Typography } from '@mui/material';
import { Goal } from '@playbingo/types';
import { Fragment } from 'react';
import { serverGet } from '../../../../../ServerUtils';
import SidebarDrawer from '../_components/SidebarDrawer';

async function getGoals(slug: string): Promise<Goal[]> {
    const res = await serverGet(`/api/games/${slug}/goals`);
    if (!res.ok) {
        return [];
    }
    return res.json();
}

export default async function GameSidebarStatisticsPage({
    params,
}: PageProps<'/rooms/[slug]'>) {
    const { slug } = await params;
    const goals = await getGoals(slug);

    const categoryCounts = goals.reduce<{ [k: string]: number }>(
        (curr, val) => {
            val.categories?.forEach((cat) => {
                if (curr[cat]) {
                    curr[cat] += 1;
                } else {
                    curr[cat] = 1;
                }
            });
            return curr;
        },
        {},
    );

    return (
        <SidebarDrawer>
            Total Goals: {goals.length}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto auto 1fr',
                    alignItems: 'center',
                    columnGap: 2,
                }}
            >
                {Object.keys(categoryCounts).map((cat) => (
                    <Fragment key={cat}>
                        <Typography>{cat}</Typography>
                        <Typography sx={{ marginLeft: '' }}>
                            {categoryCounts[cat]}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={
                                    (categoryCounts[cat] * 100) / goals.length
                                }
                                sx={{
                                    marginLeft: 'auto',
                                    width: '100%',
                                    height: 10,
                                    backgroundColor: 'background.paper',
                                }}
                            />
                        </Box>
                    </Fragment>
                ))}
            </Box>
        </SidebarDrawer>
    );
}
