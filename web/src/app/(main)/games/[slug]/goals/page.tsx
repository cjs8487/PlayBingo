import { Goal } from '@playbingo/types';
import { serverGet } from '../../../../ServerUtils';
import GoalExplorer from './_components/GoalExplorer';

const getPermissions = async (
    slug: string,
): Promise<{ canModerate: boolean; isOwner: boolean }> => {
    const res = await serverGet(`/api/games/${slug}/permissions`);
    if (!res.ok) {
        return { canModerate: false, isOwner: false };
    } else {
        return res.json();
    }
};

async function getGoals(slug: string): Promise<Goal[]> {
    const res = await serverGet(`/api/games/${slug}/goals`);
    if (!res.ok) {
        return [];
    }
    return res.json();
}

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function GameGoals({ params }: Props) {
    const { slug } = await params;

    const { canModerate } = await getPermissions(slug);

    const goals = await getGoals(slug);

    // return (
    //     <GoalManagerContextProvider slug={slug} canModerate={canModerate}>
    //         <GoalManagement />
    //     </GoalManagerContextProvider>
    // );

    return <GoalExplorer goals={goals} />;
}
