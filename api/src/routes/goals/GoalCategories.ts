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
        res.sendStatus(401);
        return;
    }
    const cat = await getCategory(id);
    if (!cat) {
        res.sendStatus(404);
        return;
    }
    if (!isModerator(cat.game.slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    const { name, max } = req.body;
    if (!name && !max) {
        res.status(400).send('Missing required fields');
        return;
    }
    if (max !== undefined && Number.isNaN(max)) {
        res.status(400).send('Invalid value for max');
        return;
    }

    res.status(200).json(await updateCategory(id, { name, max }));
});

goalCategories.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    const cat = await getCategory(id);
    if (!cat) {
        res.sendStatus(404);
        return;
    }
    if (!isModerator(cat.game.slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    res.status(200).json(await deleteCategory(id));
});

export default goalCategories;
