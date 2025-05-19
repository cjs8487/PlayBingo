import { Game } from '@playbingo/types';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { gameCoverUrl } from '../../../../lib/Utils';
import { serverFetch } from '../../../ServerUtils';
import GamePage from './GamePage';

interface Props {
    params: Promise<{ slug: string }>;
}

const getGame = cache(async (slug: string): Promise<Game | undefined> => {
    const res = await serverFetch(`/api/games/${slug}`);
    console.log(res);
    if (!res.ok) {
        return undefined;
    }
    return res.json();
});

export async function generateMetadata(props: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await props.params;
    const game = await getGame(slug);

    if (!game) {
        return {};
    }

    return {
        title: game.name,
        description: `Play ${game.name} bingo on PlayBingo.`,
        openGraph: {
            url: 'https://playbingo.gg',
            title: game.name,
            description: `Play ${game.name} bingo on PlayBingo.`,
            images: [gameCoverUrl(game.coverImage ?? '')],
        },
    };
}

export default async function GameLayout({ params }: Props) {
    const { slug } = await params;
    const game = await getGame(slug);

    if (!game) {
        notFound();
    }

    return <GamePage gameData={game} />;
}
