import { Router } from 'express';
import { isModerator } from '../../database/games/Games';
import {
    createTag,
    deleteTag,
    gameSlugForTag,
    getTag,
    getTags,
    updateTag,
} from '../../database/games/ImageTags';

const imageTags = Router();

imageTags.get('/:slug/imageTags', async (req, res) => {
    const { slug } = req.params;
    const tags = await getTags(slug);
    res.status(200).json(tags);
});

imageTags.route('/:slug/imageTags').post(async (req, res) => {
    const { slug } = req.params;
    const { label, color } = req.body;
    if (!label) {
        res.status(400).send('Missing label');
        return;
    }
    if (!color) {
        res.status(400).send('Missing color');
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

    const result = await createTag(slug, label, color);
    if (!result) {
        res.status(500).send('Failed to create tag');
        return;
    }
    res.status(200).json(result);
});

imageTags
    .route('/:slug/imageTags/:id')
    .post(async (req, res) => {
        const { slug, id } = req.params;

        const slugFromTag = await gameSlugForTag(id);
        console.log(slugFromTag);
        if (!slugFromTag) {
            res.sendStatus(404);
            return;
        }
        if (slugFromTag !== slug) {
            res.status(400).send('Tag id does not match slug');
            return;
        }

        const { label, color } = req.body;
        if (!label) {
            res.status(400).send('Missing label');
            return;
        }
        if (!color) {
            res.status(400).send('Missing color');
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

        const result = await updateTag(id, { label, color });
        res.status(200).json(result);
    })
    .delete(async (req, res) => {
        const { slug, id } = req.params;
        const tag = await getTag(id);
        if (!tag) {
            res.sendStatus(404);
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
        const success = await deleteTag(id);
        if (!success) {
            res.sendStatus(404);
            return;
        }
        res.sendStatus(200);
    });

export default imageTags;
