import { makeGeneratorSchema } from '@playbingo/shared';
import { Router } from 'express';
import { isModerator } from '../../database/games/Games';
import { getCategories } from '../../database/games/GoalCategories';
import { createVariant, updateVariant } from '../../database/games/Variants';

const variants = Router();

type GameVariantParams = {
    slug: string;
    id: string;
};

variants.post('/:slug/variants', async (req, res) => {
    const { slug } = req.params;
    const { name, description, config } = req.body;

    if (!req.session.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const isMod = await isModerator(slug, req.session.user);
    console.log(slug);
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
        const { schema } = makeGeneratorSchema(
            categories.map((c) => ({
                name: c.name,
                id: c.id,
                max: c.max,
                goalCount: c._count.goals,
            })),
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
        console.error('Error creating variant:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

variants.route('/:id').post<GameVariantParams>(async (req, res) => {
    const { slug, id } = req.params;
    const { name, description, categoryIds, generationOptions } = req.body;

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
        const { schema } = makeGeneratorSchema(
            categories.map((c) => ({
                name: c.name,
                id: c.id,
                max: c.max,
                goalCount: c._count.goals,
            })),
        );
        const result = schema.safeParse(generationOptions);
        if (!result.success) {
            res.status(400).json({ error: 'Invalid generation options' });
            return;
        }
        const updatedVariant = await updateVariant(id, {
            name,
            description: description || '',
            generatorConfig: result.data,
        });

        res.status(200).json(updatedVariant);
        return;
    } catch (error) {
        console.error('Error updating variant:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

export default variants;
