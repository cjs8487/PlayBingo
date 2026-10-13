import Contributors from './_components/Contributors';
import { Box, Container, Typography } from '@mui/material';
import Link from 'next/link';
import { Suspense } from 'react';

export default function Credits() {
    return (
        <Container sx={{ pt: 5 }}>
            <Typography variant="h4" align="center" sx={{ mb: 2 }}>
                Credits
            </Typography>
            <Typography sx={{ pb: 1 }}>
                PlayBingo would not be possible without the contributions of our
                community.
            </Typography>
            <Suspense
                fallback={
                    <Typography role="status" sx={{ my: 3 }}>
                        Loading contributors…
                    </Typography>
                }
            >
                <Contributors />
            </Suspense>
            <Box sx={{ pb: 4 }}>
                <Typography>
                    An additional, special thanks to all the community members
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
