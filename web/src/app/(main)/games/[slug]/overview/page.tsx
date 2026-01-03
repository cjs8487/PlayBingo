import { Box, Card, CardContent, Typography } from '@mui/material';
import { Game } from '@playbingo/types';
import MarkdownDisplay from '../../../../../components/MarkdownDisplay';
import { getFullUrl } from '../../../../../lib/Utils';

async function getGame(slug: string): Promise<Game | undefined> {
    const res = await fetch(getFullUrl(`/api/games/${slug}`));
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function Summary({ params }: Props) {
    const { slug } = await params;

    const game = await getGame(slug);

    if (!game) {
        return null;
    }

    const hasDescription = !!game.descriptionMd;
    const hasSetup = !!game.setupMd;
    const hasVariants = (game.difficultyVariants?.length ?? 0) > 0;

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
                        gridColumn: '1 / -1',
                    }}
                    elevation={3}
                >
                    <CardContent>
                        <Typography variant="h5" sx={{ mb: 1 }}>
                            {game.name}
                        </Typography>
                        {hasDescription && (
                            <>
                                <MarkdownDisplay
                                    source={game.descriptionMd ?? ''}
                                />
                            </>
                        )}
                        {hasVariants && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6">Variants</Typography>
                                {game.difficultyVariants?.map((variant) => (
                                    <Typography key={variant.id}>
                                        {variant.name}
                                    </Typography>
                                ))}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}
            {hasSetup && (
                <Card
                    sx={{
                        gridRow: hasDescription ? 2 : 1,
                        gridColumn: `1 / -1`,
                    }}
                    elevation={3}
                >
                    <CardContent>
                        <Typography variant="h5">Setup</Typography>
                        <MarkdownDisplay source={game.setupMd ?? ''} />
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
