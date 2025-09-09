import { Avatar, Box, Typography } from '@mui/material';
import { Game } from '@playbingo/types';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cache, ReactNode } from 'react';
import { gameCoverUrl, getFullUrl, userAvatarUrl } from '../../../../lib/Utils';
import GameTabs from './GameTabs';
import { grey } from '@mui/material/colors';

const getGame = cache(async (slug: string): Promise<Game | undefined> => {
    const res = await fetch(getFullUrl(`/api/games/${slug}`));
    if (!res.ok) {
        return undefined;
    }
    return res.json();
});

interface Props {
    params: Promise<{ slug: string }>;
    children: ReactNode;
}

export default async function GameLayout({ params, children }: Props) {
    const { slug } = await params;

    const game = await getGame(slug);

    if (!game) {
        notFound();
    }

    const { coverImage, name, owners, moderators } = game;

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
            </Box>
            <GameTabs gameData={game} />
            <Box
                sx={{
                    px: 4,
                    pt: 2,
                    height: '100%',
                    maxHeight: '100%',
                    overflowY: 'auto',
                    background: grey[900],
                    borderLeft: 2,
                    borderColor: 'divider',
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
