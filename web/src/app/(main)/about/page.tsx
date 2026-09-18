import { Box, Container, Link, Typography } from '@mui/material';
import NextLink from 'next/link';

export default function About() {
    return (
        <Container>
            <Typography variant="h1" sx={{ textAlign: 'center' }}>
                PlayBingo
            </Typography>
            <Typography variant="h2" sx={{ mb: 1 }}>
                Bingo Built For Communities.
            </Typography>
            <Typography sx={{ mb: 2 }}>
                PlayBingo allows you to create, customize, and play bingo games
                and is designed aroundt the communities that create, maintain,
                and play them.
            </Typography>
            <Typography variant="h3" sx={{ mb: 1 }}>
                By communities, for communities
            </Typography>
            <Typography sx={{ mb: 2 }}>
                PlayBingo gives communities the tools they need to create and
                maintain their own bingo games without needing to build their
                own solutions.
            </Typography>
            <Typography variant="h3" sx={{ mb: 1 }}>
                Your game, your rules
            </Typography>
            <Typography sx={{ mb: 2 }}>
                Customize generation parameters to shape how your boards are
                created and how your games are played. No two communities have
                to play bingo the same way.
            </Typography>
            <Typography variant="h3" sx={{ mb: 1 }}>
                Open by design
            </Typography>
            <Typography sx={{ mb: 2 }}>
                PlayBingo is{' '}
                <Link href="https://github.com/cjs8487/PlayBingo">
                    open source
                </Link>
                , with a public API and an ecosystem built for integrations. Use
                existing integrations or build your own.
            </Typography>
            <Typography variant="h3" sx={{ mb: 1 }}>
                No code required
            </Typography>
            <Typography sx={{ mb: 2 }}>
                PlayBingo allows you to create and manage games without writing
                code. Make a change and it&apos;s live immediately; no waiting
                for pull requests or future releases. Developers can extend
                PlayBingo when communities need something more.
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2">Play Bingo, your way.</Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Link href="/games">Browse Games</Link>
                    <Link href="/games/new">Create a Game</Link>
                </Box>
            </Box>
        </Container>
    );
}
