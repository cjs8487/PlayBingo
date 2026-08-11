import { GitHub } from '@mui/icons-material';
import { Box, Container, Typography } from '@mui/material';
import Link from 'next/link';

const contributors = [
    {
        name: 'cjs07',
        github: 'https://github.com/cjs8487',
    },
    {
        name: 'Floha258',
        github: 'https://github.com/floha258',
    },
    {
        name: 'lepelog',
        github: 'https://github.com/lepelog',
    },
    {
        name: 'tricksnl',
        github: 'https://github.com/devbeoservice',
    },
];

export default function Credits() {
    return (
        <Container sx={{ pt: 5 }}>
            <Typography variant="h4" align="center" sx={{ mb: 2 }}>
                Credits
            </Typography>
            <Typography sx={{ pb: 1 }}>
                PlayBingo would not be possible without the contributions our
                community.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {contributors.map((contributor) => (
                    <Box key={contributor.name} sx={{ pb: 2 }}>
                        <Box sx={{ pb: 1 }}>{contributor.name}</Box>
                        <Box>
                            <Link href={contributor.github}>
                                <GitHub />
                            </Link>
                        </Box>
                    </Box>
                ))}
            </Box>
            <Box sx={{ pb: 4 }}>
                <Typography>
                    An additional, special rhanks to all the community members
                    who have helped make PlayBingo better by providing feedback,
                    finding bugs, and working with us to make PlayBingo the best
                    it can be.
                </Typography>
            </Box>
            <Box>
                <Typography sx={{ pb: 1 }}>
                    PlayBingo makes use of parts of the following works made
                    available under the Creative Commons license.
                </Typography>
                <Typography variant="h5" sx={{ pb: 1 }}>
                    Sound Effects
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Link
                        href="https://lolurio.itch.io/lolurios-free-cozy-ui-sfx"
                        style={{ color: 'inherit' }}
                    >
                        UI Sound Effects by lolurio (CC BY 4.0)
                    </Link>
                </Box>
            </Box>
        </Container>
    );
}
