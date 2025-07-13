import { Box, Card, CardContent, Typography } from '@mui/material';
import { Game } from '@playbingo/types';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

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
            {(gameData.descriptionMd ||
                (gameData.difficultyVariants?.length ?? 0) > 0) && (
                <Card sx={{ gridRow: '1' }}>
                    <CardContent>
                        {gameData.descriptionMd && (
                            <>
                                <Typography variant="h5" sx={{ mb: 1 }}>
                                    {gameData.name}
                                </Typography>
                                <ReactMarkdown>
                                    {gameData.descriptionMd}
                                </ReactMarkdown>
                            </>
                        )}
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
            )}
            <Card sx={{ gridRow: '1/-1' }}>
                <CardContent>
                    <Typography variant="h5">Links</Typography>
                    <Typography>
                        <Link href="">Link 1</Link> - description
                    </Typography>
                </CardContent>
            </Card>
            {gameData.setupMd && (
                <Card>
                    <CardContent>
                        <Typography variant="h5">Setup</Typography>
                        <ReactMarkdown>{gameData.setupMd}</ReactMarkdown>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
