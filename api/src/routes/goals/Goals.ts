import { Router } from 'express';
import { isModerator } from '../../database/games/Games';
import { deleteGoal, editGoal, gameForGoal } from '../../database/games/Goals';
import upload from './Upload';
import goalCategories from './GoalCategories';
import { Prisma } from '@prisma/client';
import { validateGoalMeta } from '../../util/GoalValidation';

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
    const {
        goal,
        description,
        categories,
        difficulty,
        tags,
        meta,
        image,
        secondaryImage,
        imageTag,
        count,
    } = req.body;

    if (
        !goal &&
        description === undefined &&
        !categories &&
        !difficulty &&
        !tags &&
        meta === undefined &&
        !image &&
        !secondaryImage &&
        !imageTag &&
        count === undefined
    ) {
        res.status(400).send('No changes submitted');
        return;
    }

    // Validate meta data if provided
    if (meta !== undefined) {
        try {
            const metaJson = JSON.parse(meta);
            const metaValidation = validateGoalMeta(metaJson);
            if (!metaValidation.valid) {
                res.status(400).json({ error: metaValidation.error });
                return;
            }
        } catch {
            res.status(400).json({
                error: 'Invalid metadata - invalid JSON syntax',
            });
            return;
        }
    }

    const input: Prisma.GoalUpdateInput = {
        goal,
        description,
        meta: JSON.parse(meta),
    };

    if (difficulty !== undefined) {
        if (difficulty === '') {
            input.difficulty = null;
        } else if (difficulty > 0) {
            input.difficulty = difficulty;
        }
    }

    if (count !== undefined) {
        if (count === '') {
            input.count = null;
        } else {
            input.count = count;
        }
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

    if (tags) {
        input.tags = {
            set: [],
            connect: tags?.map((tag: string) => ({
                id: tag,
            })),
        };
    }
    if (image !== undefined) {
        if (image !== '' && image !== null) {
            input.image = {
                connect: {
                    id: image,
                },
            };
        } else {
            input.image = {
                disconnect: true,
            };
        }
    }

    if (secondaryImage !== undefined) {
        if (secondaryImage !== '' && secondaryImage !== null) {
            input.secondaryImage = {
                connect: {
                    id: secondaryImage,
                },
            };
        } else {
            input.secondaryImage = {
                disconnect: true,
            };
        }
    }

    if (imageTag !== undefined) {
        if (imageTag) {
            input.imageTag = {
                connect: {
                    id: imageTag,
                },
            };
        } else {
            input.imageTag = {
                disconnect: true,
            };
        }
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
