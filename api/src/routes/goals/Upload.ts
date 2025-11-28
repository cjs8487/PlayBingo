import { Router } from 'express';
import {
    gameForSlug,
    isModerator,
    isOwner,
    updateSRLv5Enabled,
} from '../../database/games/Games';
import {
    createGoals,
    GoalInput,
    replaceAllGoalsForGame,
} from '../../database/games/Goals';
import { getUser } from '../../database/Users';

const upload = Router();

upload.post('/srlv5', async (req, res) => {
    const { slug, goals } = req.body;

    if (!slug) {
        res.status(400).send('Missing game slug');
        return;
    }

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    if (!(await isOwner(slug, req.session.user))) {
        res.sendStatus(403);
        return;
    }

    if (!goals) {
        res.status(400).send('Missing goal list');
        return;
    }
    if (!Array.isArray(goals)) {
        res.status(400).send('Invalid goal list format');
        return;
    }
    if (goals.length === 0) {
        res.status(400).send('Missing goal list');
        return;
    }

    if (!gameForSlug(slug)) {
        res.sendStatus(404);
        return;
    }

    await createGoals(slug, goals);
    await updateSRLv5Enabled(slug, true);
    res.sendStatus(201);
});

upload.post('/list', async (req, res) => {
    const { slug, goals }: { slug: string; goals: string[] } = req.body;
    if (!slug) {
        res.status(400).send('Missing game slug');
        return;
    }

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    if (!(await isOwner(slug, req.session.user))) {
        res.sendStatus(403);
        return;
    }

    if (!goals) {
        res.status(400).send('Missing goal list');
        return;
    }
    if (!Array.isArray(goals)) {
        res.status(400).send('Invalid goal list format');
        return;
    }
    if (goals.length === 0) {
        res.status(400).send('Missing goal list');
        return;
    }

    if (!gameForSlug(slug)) {
        res.sendStatus(404);
        return;
    }

    const convertedGoals: GoalInput[] = goals.map(
        (goal: string | GoalInput) => {
            if (typeof goal === 'string') {
                return {
                    goal: goal,
                };
            }
            return goal;
        },
    );

    await createGoals(slug, convertedGoals);
    res.sendStatus(201);
});

upload.post('/replace', async (req, res) => {
    const { slug, goals }: { slug: string; goals: GoalInput[] } = req.body;

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    if (!req.session.user) {
        res.sendStatus(403);
        return;
    }

    if (!(await isModerator(slug, req.session.user))) {
        res.sendStatus(403);
        return;
    }

    if (!slug) {
        res.status(400).send('Missing game slug');
        return;
    }
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
        res.status(400).send('Invalid goal list format');
        return;
    }

    if (!gameForSlug(slug)) {
        res.sendStatus(404);
        return;
    }

    try {
        const success = await replaceAllGoalsForGame(slug, goals);
        if (!success) {
            res.status(404).send('Game not found');
            return;
        }
        res.sendStatus(200);
    } catch (e) {
        res.status(500).send('Failed to replace goals');
    }
});

export default upload;
