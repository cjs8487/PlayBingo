import { Game } from '@playbingo/types';
import GenerationForm from './_components/GenerationForm';
import { getFullUrl } from '../../../../../lib/Utils';

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

export default async function GameGeneration({ params }: Props) {
    const { slug } = await params;

    const game = await getGame(slug);

    if (!game) {
        return null;
    }

    return <GenerationForm game={game} />;
}
