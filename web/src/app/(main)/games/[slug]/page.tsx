import { notFound, redirect, RedirectType } from 'next/navigation';
import { getFullUrl } from '../../../../lib/Utils';
import { Game } from '@playbingo/types';

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

export default async function GamePage({ params }: Props) {
    const { slug } = await params;
    const game = await getGame(slug);
    if (!game) {
        notFound();
    }

    if (game.descriptionMd || game.setupMd) {
        redirect('./overview', RedirectType.replace);
    } else {
        redirect('./goals', RedirectType.replace);
    }

    return null;
}
