import { Game } from '@/types/Game';
import { Box, Container, Link, Typography } from '@mui/material';
import Image from 'next/image';
import NextLink from 'next/link';
import { ReactNode } from 'react';
import GameTabs from './GameTabs';
import { getGamePermissions } from '../../../../actions/Auth';

async function getGame(slug: string): Promise<Game | null> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_PATH}/api/games/${slug}`,
    );
    if (!res.ok) {
        return null;
    }
    return res.json();
}

interface GameLayoutProps {
    params: Promise<{ slug: string }>;
    goals: ReactNode;
}

export default async function GamePage(props: GameLayoutProps) {
    const params = await props.params;

    const { slug } = params;
    const { goals } = props;

    const gameData = await getGame(slug);
    const { canModerate, isOwner } = await getGamePermissions(slug);

    if (!gameData) {
        return null;
    }

    return (
        <Container
            sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                pt: 2,
            }}
        >
            <Box display="flex">
                <Box position="fixed" mr={4}>
                    {gameData.coverImage && (
                        <Image src={gameData.coverImage} alt="" fill />
                    )}
                    {!gameData.coverImage && (
                        <div>
                            <div>{slug}</div>
                        </div>
                    )}
                </Box>
                <Box flexGrow={1}>
                    <Link component={NextLink} href={`/games/${slug}`}>
                        {gameData.slug}
                    </Link>
                    <Typography variant="h6">{gameData.name}</Typography>
                </Box>
                <Box minWidth="30%">
                    <Typography
                        variant="body1"
                        sx={{ textDecoration: 'underline' }}
                    >
                        Owners
                    </Typography>
                    <Typography variant="body2">
                        {gameData.owners?.map((o) => o.username).join(', ')}
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ textDecoration: 'underline' }}
                    >
                        Moderators
                    </Typography>
                    <Typography variant="body2">
                        {gameData.moderators?.map((o) => o.username).join(', ')}
                    </Typography>
                </Box>
            </Box>
            <GameTabs
                gameData={gameData}
                canModerate={canModerate}
                isOwner={isOwner}
                goals={goals}
            />
        </Container>
    );
}
