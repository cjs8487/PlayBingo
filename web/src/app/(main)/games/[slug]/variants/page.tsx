import { Game, GoalCategory } from '@playbingo/types';
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

export default async function VariantsPage({ params }: Props) {
    const { slug } = await params;

    const game = await getGame(slug);
    const categories = await getCategories(slug);

    if (!game || !categories) {
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
