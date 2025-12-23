import { GoalCategory } from '@playbingo/types';
import { getFullUrl } from '../../../../../lib/Utils';
import { serverGet } from '../../../../ServerUtils';
import GoalCategories from './_components/GoalCategories';
import { Box, Divider, Typography } from '@mui/material';
import GoalTags from './_components/GoalTags';

async function getCategories(
    slug: string,
): Promise<GoalCategory[] | undefined> {
    const res = await serverGet(getFullUrl(`/api/games/${slug}/categories`));
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

async function getTags(slug: string): Promise<GoalCategory[] | undefined> {
    const res = await serverGet(getFullUrl(`/api/games/${slug}/tags`));
    if (!res.ok) {
        return undefined;
    }
    return res.json();
}

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function GamePermissions({ params }: Props) {
    const { slug } = await params;

    const categories = await getCategories(slug);
    const tags = await getTags(slug);

    return (
        <Box sx={{ height: '100%' }}>
            <Box sx={{ maxHeight: '50%', overflowY: 'auto', pt: 1 }}>
                <Typography variant="h6" gutterBottom>
                    Categories
                </Typography>
                {categories && (
                    <GoalCategories slug={slug} categories={categories} />
                )}
            </Box>
            <Divider sx={{ py: 1 }} />
            <Box sx={{ maxHeight: '50%', overflowY: 'auto', pt: 1 }}>
                <Typography variant="h6" gutterBottom>
                    Tags
                </Typography>
                {tags && <GoalTags slug={slug} tags={tags} />}
            </Box>
        </Box>
    );
}
