import { GoalImage } from '@playbingo/types';
import { serverGet } from '../../../../ServerUtils';
import { List, ListItem } from '@mui/material';
import GoalImageForm from './_components/GoalImageForm';
import NewImage from './_components/NewImage';

async function getImages(slug: string): Promise<GoalImage[]> {
    const res = await serverGet(`/api/games/${slug}/images`);
    if (!res.ok) {
        return [];
    }
    return res.json();
}

export default async function ImagesPage({
    params,
}: PageProps<'/games/[slug]'>) {
    const { slug } = await params;
    const images = await getImages(slug);

    return (
        <>
            <List sx={{ maxHeight: '100%', overflowY: 'auto' }}>
                {images.map((image) => (
                    <ListItem key={image.id}>
                        <GoalImageForm slug={slug} image={image} />
                    </ListItem>
                ))}
            </List>
            <NewImage slug={slug} />
        </>
    );
}
