import { Router } from 'express';
import {
    gameForSlug,
    isOwner,
    isModerator,
    updateSRLv5Enabled,
} from '../../database/games/Games';
import { createGoals, GoalInput, deleteAllGoalsForGame } from '../../database/games/Goals';
import { Prisma } from '@prisma/client';

const upload = Router();

upload.post('/srlv5', async (req, res) => {
    const { slug, goals } = req.body;

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    if (!isOwner(slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    if (!slug) {
        res.status(400).send('Missing game slug');
        return;
    }
    if (!goals) {
        res.status(400).send('Missing goal list');
        return;
    }
    if (!Array.isArray(goals)) {
        res.status(400).send('Invalid goal list format');
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
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    if (!isOwner(slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    if (!slug) {
        res.status(400).send('Missing game slug');
        return;
    }
    if (!goals) {
        res.status(400).send('Missing goal list');
        return;
    }
    if (!Array.isArray(goals)) {
        res.status(400).send('Invalid goal list format');
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

// Replace all goals for a game with the provided list
upload.post('/replace', async (req, res) => {
    const { slug, goals }: { slug: string; goals: GoalInput[] } = req.body;

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    if (!isModerator(slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    if (!slug) {
        res.status(400).send('Missing game slug');
        return;
    }
    if (!goals || !Array.isArray(goals)) {
        res.status(400).send('Invalid goal list format');
        return;
    }

    if (!gameForSlug(slug)) {
        res.sendStatus(404);
        return;
    }

    try {
        // Remove all existing goals for this game, then recreate provided list
        // Note: This assigns new IDs to all goals
        await deleteAllGoalsForGame(slug);
        await createGoals(slug, goals);
        res.sendStatus(200);
    } catch (e) {
        res.status(400).send('Failed to replace goals');
    }
});

export default upload;
