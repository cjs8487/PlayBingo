import { GoalCategory } from '@playbingo/types';
import { getFullUrl } from '../../../../../lib/Utils';
import { serverFetch } from '../../../../ServerUtils';
import GoalCategories from './_components/GoalCategories';

async function getCategories(
    slug: string,
): Promise<GoalCategory[] | undefined> {
    const res = await serverFetch(getFullUrl(`/api/games/${slug}/categories`));
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function GamePermissions({ params }: Props) {
    const { slug } = await params;

    const categories = await getCategories(slug);

    if (!categories) {
        return null;
    }

    return <GoalCategories slug={slug} categories={categories} />;
}
