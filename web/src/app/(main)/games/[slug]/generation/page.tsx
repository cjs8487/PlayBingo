import { GoalCategory } from '@playbingo/types';
import { getFullUrl } from '../../../../../lib/Utils';
import GenerationForm from './_components/GenerationForm';

async function getCategories(
    slug: string,
): Promise<GoalCategory[] | undefined> {
    const res = await fetch(getFullUrl(`/api/games/${slug}/categories`));
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}
interface Props {
    params: Promise<{ slug: string }>;
}

export default async function GameGeneration({ params }: Props) {
    const { slug } = await params;

    const categories = await getCategories(slug);

    if (!categories) {
        return null;
    }

    return <GenerationForm categories={categories} />;
}
