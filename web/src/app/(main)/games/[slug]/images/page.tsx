import { Divider, List, ListItem } from '@mui/material';
import { GoalImage, GoalImageTag } from '@playbingo/types';
import { serverGet } from '../../../../ServerUtils';
import GoalImageForm from './_components/GoalImageForm';
import NewImage from './_components/NewImage';
import NewTag from './_components/NewTag';
import ImageTagForm from './_components/ImageTagForm';

async function getImages(slug: string): Promise<GoalImage[]> {
    const res = await serverGet(`/api/games/${slug}/images`);
    if (!res.ok) {
        return [];
    }
    return res.json();
}

async function getImageTags(slug: string): Promise<GoalImageTag[]> {
    const res = await serverGet(`/api/games/${slug}/imageTags`);
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
    const tags = await getImageTags(slug);

    console.log(tags);

    return (
        <>
            <List sx={{ maxHeight: '50%', overflowY: 'auto', mb: 2 }}>
                {images.map((image) => (
                    <ListItem key={image.id}>
                        <GoalImageForm slug={slug} image={image} />
                    </ListItem>
                ))}
                <ListItem>
                    <NewImage slug={slug} />
                </ListItem>
            </List>
            <Divider />
            <List>
                {tags.map((image) => (
                    <ListItem key={image.id}>
                        <ImageTagForm slug={slug} tag={image} />
                    </ListItem>
                ))}
                <ListItem sx={{ overflow: 'visible' }}>
                    <NewTag slug={slug} />
                </ListItem>
            </List>
        </>
    );
}
