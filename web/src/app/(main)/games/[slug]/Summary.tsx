import { Box, Card, CardContent, Typography } from '@mui/material';
import { Game } from '@playbingo/types';
import ReactMarkdown from 'react-markdown';

interface Props {
    gameData: Game;
}
export default function Summary({ gameData }: Props) {
    const hasDescription = !!gameData.descriptionMd;
    const hasSetup = !!gameData.setupMd;
    const hasLinks = !!gameData.linksMd;
    const hasVariants = (gameData.difficultyVariants?.length ?? 0) > 0;

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateRows: 'auto auto',
                gridTemplateColumns: '1fr 250px',
                gap: 2,
            }}
        >
            {(hasDescription || hasVariants) && (
                <Card
                    sx={{
                        gridRow: 1,
                        gridColumn: `1 / ${hasLinks ? 'span 1' : 'span 2'}`,
                    }}
                >
                    <CardContent>
                        <Typography variant="h5" sx={{ mb: 1 }}>
                            {gameData.name}
                        </Typography>
                        {hasDescription && (
                            <>
                                <ReactMarkdown>
                                    {gameData.descriptionMd}
                                </ReactMarkdown>
                            </>
                        )}
                        {hasVariants && (
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
            {hasLinks && (
                <Card sx={{ gridRow: '1/-1' }}>
                    <CardContent>
                        <Typography variant="h5">Links</Typography>
                        <ReactMarkdown>{gameData.linksMd}</ReactMarkdown>
                    </CardContent>
                </Card>
            )}
            {hasSetup && (
                <Card
                    sx={{
                        gridRow: hasDescription ? 2 : 1,
                        gridColumn: `1 / ${hasLinks ? 'span 1' : 'span 2'}`,
                    }}
                >
                    <CardContent>
                        <Typography variant="h5">Setup</Typography>
                        <ReactMarkdown>{gameData.setupMd}</ReactMarkdown>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
