import { Avatar, Box, Paper, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { Game } from '@playbingo/types';
import { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import ReactMarkdown from 'react-markdown';
import { gameCoverUrl, getFullUrl, userAvatarUrl } from '../../../../lib/Utils';
import GameTabs from './_components/GameTabs';
import SidebarButtons from './_components/SidebarButtons';

const getGame = cache(async (slug: string): Promise<Game | undefined> => {
    const res = await fetch(getFullUrl(`/api/games/${slug}`));
    if (!res.ok) {
        return undefined;
    }
    return res.json();
});

export async function generateMetadata(
    props: {
        params: Promise<{ slug: string }>;
    },
    parent: ResolvingMetadata,
) {
    const { slug } = await props.params;
    const game = await getGame(slug);

    if (!game) {
        return {};
    }

    const metadata: Metadata = {
        title: game.name,
        description: `Play ${game.name} bingo on PlayBingo.`,
        openGraph: {
            url: `https://playbingo.gg/games/${slug}`,
            title: game.name,
            description: `Play ${game.name} bingo on PlayBingo.`,
        },
    };

    if (game.coverImage) {
        metadata.openGraph!.images = [gameCoverUrl(game.coverImage)];
    } else {
        metadata.openGraph!.images = (await parent).openGraph?.images;
    }

    return metadata;
}

export default async function GameLayout({
    params,
    children,
}: LayoutProps<'/games/[slug]'>) {
    const { slug } = await params;

    const game = await getGame(slug);

    if (!game) {
        notFound();
    }

    const { coverImage, name, owners, moderators, variants } = game;

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                gridTemplateColumns: 'minmax(auto, 250px) 1fr',
                height: '100%',
                overflowY: 'auto',
            }}
        >
            <Box
                sx={{
                    gridRow: '1 / -1',
                    px: 3,
                    py: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Box
                    sx={{
                        width: 110,
                    }}
                >
                    {coverImage && (
                        <Image
                            src={gameCoverUrl(coverImage)}
                            width={110}
                            height={160}
                            alt=""
                            style={{
                                aspectRatio: '11 / 16',
                                objectFit: 'cover',
                            }}
                        />
                    )}
                    {!coverImage && (
                        <Box
                            sx={{
                                width: '100%',
                                aspectRatio: '11 / 16',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px',
                                boxShadow: 'inset 0 0 12px',
                            }}
                        >
                            <Typography
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    top: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {slug}
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Typography variant="h5" textAlign="center" sx={{ mb: 1 }}>
                    {name}
                </Typography>
                {owners && owners.length > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            alignSelf: 'flex-start',
                            mb: 1,
                        }}
                    >
                        <Typography variant="h6">Owners</Typography>
                        {owners.map((owner) => (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                                key={owner.id}
                            >
                                <Avatar
                                    src={
                                        owner.avatar
                                            ? userAvatarUrl(owner.avatar)
                                            : undefined
                                    }
                                    sx={{ width: 32, height: 32 }}
                                />
                                <Typography>{owner.username}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}
                {moderators && moderators.length > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            alignSelf: 'flex-start',
                        }}
                    >
                        <Typography variant="h6">Moderators</Typography>
                        {moderators.map((mod) => (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                                key={mod.id}
                            >
                                <Avatar
                                    src={
                                        mod.avatar
                                            ? userAvatarUrl(mod.avatar)
                                            : undefined
                                    }
                                    sx={{ width: 32, height: 32 }}
                                />
                                <Typography>{mod.username}</Typography>
                            </Box>
                        ))}
                    </Box>
                )}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        alignSelf: 'flex-start',
                        mt: 2,
                    }}
                >
                    <Typography variant="h6">Links</Typography>
                    {game.linksMd && (
                        <ReactMarkdown
                            components={{
                                p({ children, ...props }) {
                                    return (
                                        <Typography
                                            {...props}
                                            sx={{
                                                mb: 1,
                                            }}
                                        >
                                            {children}
                                        </Typography>
                                    );
                                },
                                a({ children, ...props }) {
                                    const { href, ...restProps } = props;
                                    return (
                                        <Link href={href ?? ''} {...restProps}>
                                            {children}
                                        </Link>
                                    );
                                },
                            }}
                        >
                            {game.linksMd}
                        </ReactMarkdown>
                    )}
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    <SidebarButtons slug={slug} variants={variants ?? []} />
                </Box>
            </Box>
            <GameTabs gameData={game} />
            <Paper
                sx={{
                    px: 4,
                    pt: 2,
                    height: '100%',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    overflowY: 'auto',
                    background: grey[900],
                    borderLeft: 2,
                    borderColor: 'divider',
                    borderRadius: 0,
                }}
            >
                {children}
            </Paper>
        </Box>
    );
}
