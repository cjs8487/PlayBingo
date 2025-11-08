import GoalManagement from '@/app/(main)/games/[slug]/goals/_components/GoalManagement';
import { GoalManagerContextProvider } from '@/context/GoalManagerContext';
import { serverGet } from '../../../../ServerUtils';
import { Category } from '@playbingo/types';

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

async function getCategories(slug: string): Promise<Category[] | undefined> {
    const res = await serverGet(`/api/games/${slug}/categories`);
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function GameGoals({ params }: Props) {
    const { slug } = await params;

    const { canModerate } = await getPermissions(slug);
    const categories = await getCategories(slug);

    if (!categories) {
        return null;
    }

    return (
        <GoalManagerContextProvider
            slug={slug}
            canModerate={canModerate}
            categories={categories}
        >
            <GoalManagement />
        </GoalManagerContextProvider>
    );
}
