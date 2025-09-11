import { Game } from '@playbingo/types';
import { getFullUrl } from '../../../../../lib/Utils';
import Variants from './_components/Variants';

async function getGame(slug: string): Promise<Game | undefined> {
    const res = await fetch(getFullUrl(`/api/games/${slug}`));
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

    if (!game) {
        return null;
    }

    return <Variants gameData={game} />;
}
