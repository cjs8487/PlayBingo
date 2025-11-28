import { Router } from 'express';
import { isModerator } from '../../database/games/Games';
import {
    createImage,
    deleteImage,
    gameSlugForImage,
    getImages,
    updateImage,
} from '../../database/games/GoalImages';
import { saveFile } from '../../media/MediaServer';

const goalImages = Router();

goalImages.get('/:slug/images', async (req, res) => {
    const { slug } = req.params;
    const images = await getImages(slug);
    res.status(200).json(images);
});

goalImages.post('/:slug/images', async (req, res) => {
    const { slug } = req.params;
    const { image, name } = req.body;

    if (!image) {
        res.status(400).send('Missing image');
        return;
    }
    if (!name) {
        res.status(400).send('Missing name');
        return;
    }

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    if (!(await isModerator(slug, req.session.user))) {
        res.sendStatus(403);
        return;
    }

    if (!saveFile(image)) {
        res.status(400).send('Invalid image');
        return;
    }

    const result = await createImage(slug, image, name);
    if (!result) {
        res.status(500).send('Failed to create image');
        return;
    }
    res.status(201).json(result);
});

goalImages
    .route('/:slug/images/:id')
    .post(async (req, res) => {
        const { slug, id } = req.params;

        const slugFromImage = await gameSlugForImage(id);
        if (!slugFromImage) {
            res.sendStatus(404);
            return;
        }
        if (slugFromImage !== slug) {
            res.status(400).send('Goal image id does not match slug');
            return;
        }

        if (!req.session.user) {
            res.sendStatus(401);
            return;
        }
        if (!(await isModerator(slug, req.session.user))) {
            res.sendStatus(403);
            return;
        }

        const { image, name } = req.body;
        if (!image && !name) {
            res.status(400).send('No changes provided');
            return;
        }
        if (image) {
            if (!saveFile(image)) {
                res.status(400).send('Invalid image');
                return;
            }
        }

        const result = await updateImage(id, { mediaFile: image, name });
        res.status(200).json(result);
    })
    .delete(async (req, res) => {
        const { slug, id } = req.params;

        const slugFromImage = await gameSlugForImage(id);
        if (!slugFromImage) {
            res.sendStatus(404);
            return;
        }
        if (slugFromImage !== slug) {
            res.status(400).send('Goal image id does not match slug');
            return;
        }

        if (!req.session.user) {
            res.sendStatus(401);
            return;
        }
        if (!(await isModerator(slug, req.session.user))) {
            res.sendStatus(403);
            return;
        }

        const success = await deleteImage(id);
        if (!success) {
            res.sendStatus(404);
            return;
        }
        res.sendStatus(200);
    });

export default goalImages;
