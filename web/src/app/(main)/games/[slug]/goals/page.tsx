import GoalManagement from '@/app/(main)/games/[slug]/goals/_components/GoalManagement';
import { GoalManagerContextProvider } from '@/context/GoalManagerContext';
import { serverGet } from '../../../../ServerUtils';

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

async function getImages(slug: string) {
    const res = await serverGet(`/api/games/${slug}/images`);
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
    const images = await getImages(slug);

    return (
        <GoalManagerContextProvider
            slug={slug}
            canModerate={canModerate}
            images={images}
        >
            <GoalManagement />
        </GoalManagerContextProvider>
    );
}
