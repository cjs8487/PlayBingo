import { Router } from 'express';
import { prisma } from '../../../database/Database';
import { Prisma } from '@prisma/client';

const translationsRouter = Router();

translationsRouter.get('/:slug/translations', async (req, res) => {
    const { slug } = req.params;

    const result = (await prisma.game.findUnique({ where: { slug } }))
        ?.translations;
    res.json(result);
    return;
});

translationsRouter.post('/:slug/translations', async (req, res) => {
    const { slug } = req.params;
    const newTranslations = req.body.translations;
    if (!Array.isArray(newTranslations)) {
        res.status(400).json({
            error: 'Translations must be an array',
        });
    }
    const oldTranslations = (await prisma.game.findUnique({ where: { slug } }))
        ?.translations;
    if (!oldTranslations) {
        const dbRes = await prisma.game.update({
            where: { slug },
            data: { translations: newTranslations },
        });
        res.json(dbRes);
        return;
    }
    const allTranslations = oldTranslations.concat(newTranslations);
    const dbRes = await prisma.game.update({
        where: { slug },
        data: { translations: allTranslations },
    });
    res.json(dbRes);
});

translationsRouter.delete('/:slug/translations', async (req, res) => {
    const { slug } = req.params;
    const translationsToDelete: string[] = req.body.translations;
    if (!Array.isArray(translationsToDelete)) {
        res.status(400).json({
            error: 'Translations must be an array',
        });
        return;
    }

    const goals = await prisma.goal.findMany({
        where: { game: { slug } },
    });
    goals.forEach((goal) => {
        const goalTranslations = goal.translations as unknown as {
            [k: string]: string;
        };
        if (!goalTranslations) {
            return;
        }
        translationsToDelete.forEach((lang) => {
            delete goalTranslations[lang];
        });
    });

    const translations = (await prisma.game.findUnique({ where: { slug } }))
        ?.translations;

    if (!translations) {
        res.status(404).json({
            error: 'No translations found.',
        });
        return;
    }

    const translationIndexesUpdate = translationsToDelete.map((lang) => {
        return translations.indexOf(lang);
    });

    translationIndexesUpdate.forEach((i) => {
        translations.splice(i, 1);
    });

    try {
        await prisma.$transaction(async () => {
            await Promise.all(
                goals.map((goal) => {
                    return prisma.goal.update({
                        where: { id: goal.id },
                        data: { translations: goal.translations },
                    });
                }),
            );
            await prisma.game.update({
                where: { slug },
                data: { translations },
            });
        });
    } catch (error: unknown) {
        const e = error as Prisma.PrismaClientKnownRequestError;
        res.status(500).json({ success: false, error: e.message });
    }

    res.status(200).json({ success: true });
});

translationsRouter.put('/:slug/translations', async (req, res) => {
    const { slug } = req.params;
    const updatePairs: { old: string; new: string }[] = req.body.translations;
    if (!Array.isArray(updatePairs)) {
        res.status(400).json({
            error: 'Translations must be an array, in the form of {old: language, new: language}',
        });
    }
    const translations = (await prisma.game.findUnique({ where: { slug } }))
        ?.translations;

    if (!translations) {
        res.status(404).json({
            error: 'No translations found.',
        });
        return;
    }

    let error = false;
    updatePairs.forEach((p) => {
        if (!p.old || !p.new) {
            res.status(400).json({
                error: 'Translations must be an array, in the form of {old: language, new: language}',
            });
            error = true;
            return;
        }
        const i = translations.indexOf(p.old);
        if (i === -1) {
            res.status(404).json({
                error: `Translation ${p.old} not found.`,
            });
            error = true;
            return;
        }
        translations[i] = p.new;
    });

    if (error) return;

    const goals = await prisma.goal.findMany({ where: { game: { slug } } });

    goals.forEach((goal) => {
        if (!goal.translations) {
            return;
        }

        updatePairs.forEach((p) => {
            goal.translations[p.new] = goal.translations[p.old];
            delete goal.translations[p.old];
        });
    });

    try {
        await prisma.$transaction(async () => {
            await Promise.all(
                goals.map((goal) => {
                    return prisma.goal.update({
                        where: { id: goal.id },
                        data: { translations: goal.translations },
                    });
                }),
            );
            await prisma.game.update({
                where: { slug },
                data: { translations },
            });
        });
    } catch (error: unknown) {
        const e = error as Prisma.PrismaClientKnownRequestError;
        res.status(500).json({ success: false, error: e.message });
    }

    res.status(200).json({ success: true });
});

export { translationsRouter };
