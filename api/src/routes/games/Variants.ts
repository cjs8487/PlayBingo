import { makeGeneratorSchema } from '@playbingo/shared';
import { Router } from 'express';
import { isModerator } from '../../database/games/Games';
import { getCategories } from '../../database/games/GoalCategories';
import {
    createVariant,
    deleteVariant,
    updateVariant,
} from '../../database/games/Variants';
import { Prisma } from '@prisma/client';
import { logError } from '../../Logger';
import { goalsForGameFull } from '../../database/games/Goals';

const variants = Router();

variants.post('/:slug/variants', async (req, res) => {
    const { slug } = req.params;
    const { name, description, config } = req.body;

    if (!req.session.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const isMod = await isModerator(slug, req.session.user);
    if (!isMod) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }

    if (!slug) {
        res.status(400).json({ error: 'Missing game slug' });
        return;
    }
    if (!name) {
        res.status(400).json({ error: 'Missing variant name' });
        return;
    }

    try {
        const categories = await getCategories(slug);
        const goals = await goalsForGameFull(slug);
        const { schema } = makeGeneratorSchema(
            categories.map((c) => ({
                name: c.name,
                id: c.id,
                max: c.max,
                goalCount: c._count.goals,
            })),
            goals,
        );
        const result = schema.safeParse(config);
        if (!result.success) {
            res.status(400).json({
                error: 'Invalid generation options',
                ...result.error,
            });
            return;
        }
        const newVariant = await createVariant(
            slug,
            name,
            result.data,
            description,
        );

        res.status(201).json(newVariant);
        return;
    } catch (error) {
        logError(`Error creating variant: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

variants
    .route('/:slug/variants/:id')
    .post(async (req, res) => {
        const { slug, id } = req.params;
        const { name, description, config } = req.body;

        if (!req.session.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const isMod = await isModerator(slug, req.session.user);
        if (!isMod) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        if (!name) {
            res.status(400).json({ error: 'Missing variant name' });
            return;
        }

        try {
            const categories = await getCategories(slug);
            const goals = await goalsForGameFull(slug);
            const { schema } = makeGeneratorSchema(
                categories.map((c) => ({
                    name: c.name,
                    id: c.id,
                    max: c.max,
                    goalCount: c._count.goals,
                })),
                goals,
            );
            const result = schema.safeParse(config);
            if (!result.success) {
                res.status(400).json({
                    error: 'Invalid generation options',
                    ...result.error,
                });
                return;
            }
            const updatedVariant = await updateVariant(id, {
                name,
                description: description || '',
                generatorSettings: result.data,
            });

            res.status(200).json(updatedVariant);
            return;
        } catch (error) {
            logError(`Error updating variant: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
    })
    .delete(async (req, res) => {
        const { slug, id } = req.params;

        if (!req.session.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const isMod = await isModerator(slug, req.session.user);
        if (!isMod) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        try {
            await deleteVariant(id);
            res.status(204).end();
            return;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    res.status(404).json({ error: 'Variant not found' });
                    return;
                }
            }
            logError(`Error deleting variant: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
    });

export default variants;
