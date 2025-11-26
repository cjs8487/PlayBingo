import { Router } from 'express';
import { isModerator } from '../../database/games/Games';
import { deleteGoal, editGoal, gameForGoal } from '../../database/games/Goals';
import upload from './Upload';
import goalCategories from './GoalCategories';
import { Prisma } from '@prisma/client';

const goals = Router();

goals.get('/:id', (req, res) => {
    res.sendStatus(500);
});

goals.post('/:id', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    const game = await gameForGoal(req.params.id);
    console.log(game);

    // If no game could be found, the goal probably doesn't exist
    if (!game) {
        res.sendStatus(404);
        return;
    }

    if (!(await isModerator(game.slug, req.session.user))) {
        res.sendStatus(403);
        return;
    }

    const { id } = req.params;
    const { goal, description, categories, difficulty } = req.body;

    if (!goal && description === undefined && !categories && !difficulty) {
        res.status(400).send('No changes submitted');
        return;
    }

    const input: Prisma.GoalUpdateInput = {
        goal,
        description,
    };

    if (difficulty === 0) {
        input.difficulty = null;
    } else if (difficulty > 0) {
        input.difficulty = difficulty;
    }

    if (categories) {
        input.categories = {
            set: [],
            connectOrCreate: categories?.map((cat: string) => ({
                create: { name: cat, game: { connect: { id: game.id } } },
                where: {
                    gameId_name: {
                        gameId: game.id,
                        name: cat,
                    },
                },
            })),
        };
    }

    const success = await editGoal(id, input);
    if (!success) {
        res.sendStatus(404);
        return;
    }
    res.sendStatus(200);
});

goals.delete('/:id', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    const game = await gameForGoal(req.params.id);

    // If no game could be found, the goal probably doesn't exist
    if (!game) {
        res.sendStatus(404);
        return;
    }

    if (!(await isModerator(game.slug, req.session.user))) {
        res.sendStatus(403);
        return;
    }

    const { id } = req.params;
    const success = await deleteGoal(id);
    if (!success) {
        res.sendStatus(404);
        return;
    }
    res.sendStatus(200);
});

goals.use('/upload', upload);
goals.use('/categories', goalCategories);

export default goals;
