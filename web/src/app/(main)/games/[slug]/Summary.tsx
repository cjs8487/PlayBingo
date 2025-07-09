import { Box, Card, CardContent, Typography } from '@mui/material';
import { Game } from '@playbingo/types';
import Link from 'next/link';

interface Props {
    gameData: Game;
}
export default function Summary({ gameData }: Props) {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateRows: 'auto auto',
                gridTemplateColumns: '1fr 250px',
                gap: 2,
            }}
        >
            <Card sx={{ gridRow: '1' }}>
                <CardContent>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        {gameData.name}
                    </Typography>
                    <Typography>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat. Duis aute irure dolor in
                        reprehenderit in voluptate velit esse cillum dolore eu
                        fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit
                        anim id est laborum.
                    </Typography>
                    {(gameData.difficultyVariants?.length ?? 0) > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6">Variants</Typography>
                            {gameData.difficultyVariants?.map((variant) => (
                                <Typography key={variant.id}>
                                    {variant.name}
                                </Typography>
                            ))}
                        </Box>
                    )}
                </CardContent>
            </Card>
            <Card sx={{ gridRow: '1/-1' }}>
                <CardContent>
                    <Typography variant="h5">Links</Typography>
                    <Typography>
                        <Link href="">Link 1</Link> - description
                    </Typography>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <Typography variant="h5">Setup</Typography>
                    <Typography>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat. Duis aute irure dolor in
                        reprehenderit in voluptate velit esse cillum dolore eu
                        fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit
                        anim id est laborum.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
