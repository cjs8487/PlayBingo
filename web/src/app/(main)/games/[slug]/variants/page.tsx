import { Game, Goal, GoalCategory, GoalTag } from '@playbingo/types';
import { getFullUrl } from '../../../../../lib/Utils';
import { serverGet } from '../../../../ServerUtils';
import DifficultyVariants from './_components/DifficultyVariants';
import Variants from './_components/Variants';

async function getGame(slug: string): Promise<Game | undefined> {
    const res = await serverGet(getFullUrl(`/api/games/${slug}`));
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

async function getGoals(slug: string): Promise<Goal[] | undefined> {
    const res = await serverGet(getFullUrl(`/api/games/${slug}/goals`));
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

async function getTags(slug: string): Promise<GoalTag[]> {
    const res = await serverGet(getFullUrl(`/api/games/${slug}/tags`));
    if (!res.ok) {
        return [];
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

export default async function VariantsPage({ params }: Props) {
    const { slug } = await params;

    const game = await getGame(slug);
    const categories = await getCategories(slug);
    const goals = await getGoals(slug);
    const tags = await getTags(slug);

    if (!game || !categories || !goals || !tags) {
        return null;
    }

    const {
        difficultyGroups,
        difficultyVariants,
        difficultyVariantsEnabled,
        isMod,
        variants,
    } = game;

    return (
        <>
            <Variants
                variants={variants ?? []}
                moderator={isMod}
                slug={slug}
                categories={categories}
                goals={goals}
                tags={tags}
            />
            {difficultyVariantsEnabled && difficultyVariants && (
                <DifficultyVariants
                    slug={slug}
                    groups={difficultyGroups ?? 0}
                    variants={difficultyVariants}
                    moderator={isMod}
                />
            )}
        </>
    );
}
