import GoalManagement from '@/app/(main)/games/[slug]/goals/_components/GoalManagement';
import { GoalManagerContextProvider } from '@/context/GoalManagerContext';
import { serverGet } from '../../../../ServerUtils';
import { GoalTag } from '@playbingo/types';

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

const getTags = async (slug: string): Promise<GoalTag[]> => {
    const res = await serverGet(`/api/games/${slug}/tags`);
    if (!res.ok) {
        return [];
    } else {
        return res.json();
    }
};

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function GameGoals({ params }: Props) {
    const { slug } = await params;

    const { canModerate } = await getPermissions(slug);

    const tags = await getTags(slug);

    return (
        <GoalManagerContextProvider
            slug={slug}
            canModerate={canModerate}
            tags={tags}
        >
            <GoalManagement />
        </GoalManagerContextProvider>
    );
}
