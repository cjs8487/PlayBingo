import { GeneratorSettings } from '@playbingo/shared';
import { Game, GoalCategory } from '@playbingo/types';
import { getFullUrl } from '../../../../../lib/Utils';
import GenerationForm from './_components/GenerationForm';
import { serverGet } from '../../../../ServerUtils';

async function getGame(slug: string): Promise<Game | undefined> {
    const res = await serverGet(getFullUrl(`/api/games/${slug}`));
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

async function getCategories(
    slug: string,
): Promise<GoalCategory[] | undefined> {
    const res = await serverGet(getFullUrl(`/api/games/${slug}/categories`));
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

    const game = await getGame(slug);
    const categories = await getCategories(slug);

    if (!game || !categories) {
        return null;
    }

    return (
        <GenerationForm
            slug={slug}
            categories={categories}
            initialValues={game.generationSettings as GeneratorSettings}
        />
    );
}
