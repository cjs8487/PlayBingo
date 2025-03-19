import { Router } from 'express';
import {
    deleteCategory,
    getCategory,
    updateCategory,
} from '../../database/games/GoalCategories';
import { isModerator } from '../../database/games/Games';

const goalCategories = Router();

goalCategories.post('/:id', async (req, res) => {
    const { id } = req.params;

    if (!req.session.user) {
        return res.sendStatus(401);
    }
    const cat = await getCategory(id);
    if (!cat) {
        return res.sendStatus(404);
    }
    if (!isModerator(cat.game.slug, req.session.user)) {
        return res.sendStatus(403);
    }

    const { name, max } = req.body;
    if (!name && !max) {
        return res.status(400).send('Missing required fields');
    }
    if (max !== undefined && Number.isNaN(max)) {
        return res.status(400).send('Invalid value for max');
    }

    res.status(200).json(await updateCategory(id, { name, max }));
});

goalCategories.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!req.session.user) {
        return res.sendStatus(401);
    }
    const cat = await getCategory(id);
    if (!cat) {
        return res.sendStatus(404);
    }
    if (!isModerator(cat.game.slug, req.session.user)) {
        return res.sendStatus(403);
    }

    res.status(200).json(await deleteCategory(id));
});

export default goalCategories;
