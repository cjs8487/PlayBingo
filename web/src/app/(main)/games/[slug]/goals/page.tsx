import GoalManagement from '@/app/(main)/games/[slug]/goals/_components/GoalManagement';
import { GoalManagerContextProvider } from '@/context/GoalManagerContext';
import { Category, GoalTag } from '@playbingo/types';
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

async function getCategories(slug: string): Promise<Category[] | undefined> {
    const res = await serverGet(`/api/games/${slug}/categories`);
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}
const getTags = async (slug: string): Promise<GoalTag[]> => {
    const res = await serverGet(`/api/games/${slug}/tags`);
    if (!res.ok) {
        return [];
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

async function getImageTags(slug: string) {
    const res = await serverGet(`/api/games/${slug}/imageTags`);
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
    const categories = await getCategories(slug);

    if (!categories) {
        return null;
    }

    const tags = await getTags(slug);
    const images = await getImages(slug);
    const imageTags = await getImageTags(slug);

    return (
        <GoalManagerContextProvider
            slug={slug}
            canModerate={canModerate}
            categories={categories}
            tags={tags}
            images={images}
            imageTags={imageTags}
        >
            <GoalManagement />
        </GoalManagerContextProvider>
    );
}
