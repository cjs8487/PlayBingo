import { Goal } from '@playbingo/types';
import { serverGet } from '../../../../../ServerUtils';
import SidebarDrawer from '../_components/SidebarDrawer';
import { Box } from '@mui/material';

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
            {Object.keys(categoryCounts).map((cat) => (
                <Box key={cat}>
                    {cat}: {categoryCounts[cat]}
                </Box>
            ))}
        </SidebarDrawer>
    );
}
