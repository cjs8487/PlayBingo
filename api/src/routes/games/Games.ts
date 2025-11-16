import { makeGeneratorSchema } from '@playbingo/shared';
import { Game } from '@playbingo/types';
import { Router } from 'express';
import BoardGenerator from '../../core/generation/BoardGenerator';
import {
    addModerators,
    addOwners,
    allGames,
    createDifficultyVariant,
    createGame,
    deleteDifficultyVariant,
    deleteGame,
    favoriteGame,
    gameForSlug,
    getGameCover,
    isModerator,
    isOwner,
    removeModerator,
    removeOwner,
    unfavoriteGame,
    updateDescription,
    updateDifficultyGroups,
    updateDifficultyVariant,
    updateDifficultyVariantsEnabled,
    updateGameCover,
    updateGameName,
    updateGeneratorSettings,
    updateLinks,
    updateRacetimeCategory,
    updateRacetimeGoal,
    updateSetup,
    updateSlugWords,
    updateSRLv5Enabled,
    updateUseTypedRandom,
} from '../../database/games/Games';
import {
    createCateogry,
    getCategories,
} from '../../database/games/GoalCategories';
import {
    createGoal,
    deleteAllGoalsForGame,
    goalsForGame,
    goalsForGameFull,
} from '../../database/games/Goals';
import { getVariant } from '../../database/games/Variants';
import { getUser, getUsersEligibleToModerateGame } from '../../database/Users';
import { deleteFile, saveFile } from '../../media/MediaServer';
import variants from './Variants';
import { GenerationFailedError } from '../../core/generation/GenerationFailedError';

const games = Router();

games.get('/', async (req, res) => {
    const result = await allGames(req.session.user);
    res.status(200).json(result);
});

games.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    const game = await gameForSlug(slug);
    if (!game) {
        res.sendStatus(404);
        return;
    }
    const result: Game = {
        id: game.id,
        name: game.name,
        slug: game.slug,
        coverImage: game.coverImage ?? undefined,
        owners: game.owners.map((owner) => ({
            id: owner.id,
            username: owner.username,
            staff: owner.staff,
            avatar: owner.avatar ?? undefined,
        })),
        moderators: game.moderators.map((mod) => ({
            id: mod.id,
            username: mod.username,
            staff: mod.staff,
            avatar: mod.avatar ?? undefined,
        })),
        enableSRLv5: game.enableSRLv5,
        racetimeBeta: game.racetimeBeta,
        racetimeCategory: game.racetimeCategory ?? undefined,
        racetimeGoal: game.racetimeGoal ?? undefined,
        difficultyVariantsEnabled: game.difficultyVariantsEnabled,
        difficultyVariants: game.difficultyVariants,
        difficultyGroups: game.difficultyGroups ?? undefined,
        slugWords: game.slugWords,
        useTypedRandom: game.useTypedRandom,
        newGeneratorBeta: game.newGeneratorBeta,
        descriptionMd: game.descriptionMd ?? undefined,
        setupMd: game.setupMd ?? undefined,
        linksMd: game.linksMd ?? undefined,
        isMod: await isModerator(slug, req.session.user ?? ''),
    };
    if (game.newGeneratorBeta) {
        result.generationSettings = game.generatorSettings;
        result.variants = [];
        game.variants.forEach((variant) => {
            result.variants?.push({
                id: variant.id,
                name: variant.name,
                description: variant.description ?? undefined,
                generatorSettings:
                    variant.generatorSettings ?? game.generatorSettings,
            });
        });
    }
    res.status(200).json(result);
});

games.post('/', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    const { name, slug, coverImage } = req.body;
    if (!name) {
        res.status(400).send('Missing game name');
        return;
    }
    if (!slug) {
        res.status(400).send('Missing game slug');
        return;
    }
    if (coverImage) {
        if (!saveFile(coverImage)) {
            res.status(400).send('Invalid cover image');
            return;
        }
    }
    const result = await createGame(name, slug, coverImage, [req.session.user]);
    if (!result) {
        res.status(500).send('Failed to create game');
        return;
    }
    if ('statusCode' in result) {
        res.status(result.statusCode).send(result.message);
        return;
    }

    res.status(200).json(result);
});

games.post('/:slug', async (req, res) => {
    const { slug } = req.params;
    const {
        name,
        coverImage,
        enableSRLv5,
        racetimeCategory,
        racetimeGoal,
        difficultyVariantsEnabled,
        difficultyGroups,
        slugWords,
        useTypedRandom,
        shouldDeleteCover,
        descriptionMd,
        setupMd,
        linksMd,
    } = req.body;

    let result = undefined;
    if (name) {
        result = await updateGameName(slug, name);
    }
    if (coverImage) {
        if (!(await saveFile(coverImage))) {
            res.status(400).send('Invalid cover image');
            return;
        }
        result = await updateGameCover(slug, coverImage);
    }
    if (shouldDeleteCover) {
        const currentCover = await getGameCover(slug);
        if (currentCover) {
            await deleteFile('game', currentCover);
            result = await updateGameCover(slug, null);
        }
    }
    if (enableSRLv5 !== undefined) {
        result = await updateSRLv5Enabled(slug, !!enableSRLv5);
    }
    if (racetimeCategory) {
        result = await updateRacetimeCategory(slug, racetimeCategory);
    }
    if (racetimeGoal) {
        result = await updateRacetimeGoal(slug, racetimeGoal);
    }
    if (difficultyVariantsEnabled !== undefined) {
        result = await updateDifficultyVariantsEnabled(
            slug,
            difficultyVariantsEnabled,
        );
    }
    if (difficultyGroups) {
        result = await updateDifficultyGroups(slug, difficultyGroups);
    }
    if (slugWords) {
        if (!Array.isArray(slugWords)) {
            res.status(400).send('Incorrect slug word format');
            return;
        }
        if (slugWords.length > 0) {
            if (slugWords.length < 50) {
                res.status(400).send('Not enough slug words provided');
                return;
            }
            if (!slugWords.every((word) => word.match(/^[a-zA-Z]*$/))) {
                res.status(400).send('Slug words can only contain letters');
                return;
            }
            result = await updateSlugWords(slug, slugWords);
        }
    }
    if (useTypedRandom !== undefined) {
        result = await updateUseTypedRandom(slug, !!useTypedRandom);
    }
    if (descriptionMd !== undefined) {
        result = await updateDescription(slug, descriptionMd);
    }
    if (setupMd !== undefined) {
        result = await updateSetup(slug, setupMd);
    }
    if (linksMd !== undefined) {
        result = await updateLinks(slug, linksMd);
    }

    if (!result) {
        res.status(400).send('No changes provided');
        return;
    }

    res.status(200).json(result);
});

games.get('/:slug/goals', async (req, res) => {
    const { slug } = req.params;
    const { includeFullCatData } = req.query;

    let goals;
    if (includeFullCatData) {
        goals = await goalsForGameFull(slug);
    } else {
        goals = await goalsForGame(slug);
    }
    res.status(200).json(goals);
});

games.post('/:slug/goals', async (req, res) => {
    const { slug } = req.params;
    const { goal, description, categories, difficulty } = req.body;
    let difficultyNum: number | undefined = undefined;
    if (difficulty) {
        difficultyNum = Number(difficulty);
        if (Number.isNaN(difficultyNum)) {
            res.status(400).send('Invalid difficulty value');
            return;
        }
    }
    if (!goal) {
        res.status(400).send('Missing goal text');
        return;
    }
    const newGoal = await createGoal(
        slug,
        goal,
        description,
        categories,
        difficultyNum,
    );
    res.status(200).json(newGoal);
});

games.get('/:slug/eligibleMods', async (req, res) => {
    const { slug } = req.params;
    const userList = await getUsersEligibleToModerateGame(slug);
    res.status(200).json(userList);
});

games.post('/:slug/owners', async (req, res) => {
    const { slug } = req.params;
    const { users } = req.body;

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    if (!isOwner(slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    if (!users) {
        res.status(400).send('Missing users');
        return;
    }
    if (!Array.isArray(users)) {
        res.status(400).send('Users parameter is not an array');
        return;
    }
    const allUsersExist = (
        await Promise.all(
            users.map(async (user) => {
                if (!getUser(user)) {
                    return false;
                }
                return true;
            }),
        )
    ).every((b) => b);

    if (!allUsersExist) {
        res.sendStatus(400);
        return;
    }

    await addOwners(slug, users);
    res.sendStatus(200);
});

games.delete('/:slug/owners', async (req, res) => {
    const { slug } = req.params;
    const { user } = req.body;

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    if (!isOwner(slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    if (!user) {
        res.status(400).send('Missing user');
        return;
    }
    if (!getUser(user)) {
        res.sendStatus(404);
        return;
    }
    const game = await gameForSlug(slug);
    if (!game) {
        res.sendStatus(404);
        return;
    }
    if (game.owners.length <= 1) {
        res.status(400).send('Cannot remove the last owner of a game.');
    }

    await removeOwner(slug, user);
    res.sendStatus(200);
});

games.post('/:slug/moderators', async (req, res) => {
    const { slug } = req.params;
    const { users } = req.body;

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    if (!isOwner(slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    if (!users) {
        res.status(400).send('Missing users');
        return;
    }
    if (!Array.isArray(users)) {
        res.status(400).send('Users parameter is not an array');
        return;
    }
    const allUsersExist = (
        await Promise.all(
            users.map(async (user) => {
                if (!getUser(user)) {
                    return false;
                }
                return true;
            }),
        )
    ).every((b) => b);

    if (!allUsersExist) {
        res.sendStatus(400);
        return;
    }

    await addModerators(slug, users);
    res.sendStatus(200);
});

games.delete('/:slug/moderators', async (req, res) => {
    const { slug } = req.params;
    const { user } = req.body;

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    if (!isOwner(slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    if (!user) {
        res.status(400).send('Missing user');
        return;
    }
    if (!getUser(user)) {
        res.sendStatus(404);
        return;
    }

    await removeModerator(slug, user);
    res.sendStatus(200);
});

games.get('/:slug/permissions', async (req, res) => {
    const { slug } = req.params;

    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    res.status(200).json({
        isOwner: await isOwner(slug, req.session.user),
        canModerate: await isModerator(slug, req.session.user),
    });
});

games.delete('/:slug/deleteAllGoals', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    const { slug } = req.params;

    // Check if user is a moderator
    if (!(await isModerator(slug, req.session.user))) {
        res.sendStatus(403);
        return;
    }

    const success = await deleteAllGoalsForGame(slug);

    if (!success) {
        res.status(500).send('Failed to delete all goals');
        return;
    }

    res.status(200).send('All goals deleted successfully');
});

games.post('/:slug/favorite', (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    const { slug } = req.params;
    favoriteGame(slug, req.session.user);

    res.sendStatus(200);
});

games.delete('/:slug/favorite', (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    const { slug } = req.params;
    unfavoriteGame(slug, req.session.user);

    res.sendStatus(200);
});

games.post('/:slug/difficultyVariants', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    const { slug } = req.params;

    if (!slug || !(await isOwner(slug, req.session.user))) {
        res.sendStatus(403);
        return;
    }

    const { name, goalAmounts } = req.body;

    const result = await createDifficultyVariant(slug, name, goalAmounts);

    res.status(200).send(result);
});

games.post('/:slug/difficultyVariants/:id', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    const { slug, id } = req.params;
    if (!slug || !(await isOwner(slug, req.session.user))) {
        res.sendStatus(403);
        return;
    }

    const { name, goalAmounts } = req.body;

    const result = await updateDifficultyVariant(id, name, goalAmounts);

    res.status(200).send(result);
});

games.delete('/:slug/difficultyVariants/:id', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    const { slug, id } = req.params;
    if (!slug || !(await isOwner(slug, req.session.user))) {
        res.sendStatus(403);
        return;
    }

    const result = await deleteDifficultyVariant(id);
    res.status(200).send(result);
});

games.delete('/:slug', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    const { slug } = req.params;

    if (!isOwner(slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    const result = await deleteGame(slug);
    res.status(200).json(result);
});

games
    .route('/:slug/categories')
    .get(async (req, res) => {
        const { slug } = req.params;

        const categories = await getCategories(slug);
        categories.sort((a, b) => (a.name > b.name ? 1 : -1));
        res.status(200).json(
            categories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                max: cat.max,
                goalCount: cat._count.goals,
            })),
        );
    })
    .post(async (req, res) => {
        const { slug } = req.params;

        if (!req.session.user) {
            res.sendStatus(401);
            return;
        }
        if (!isModerator(slug, req.session.user)) {
            res.sendStatus(403);
            return;
        }

        const { name, max } = req.body;
        if (!name && !max) {
            res.status(400).send('Missing required fields');
            return;
        }
        if (max !== undefined && Number.isNaN(Number(max))) {
            res.status(400).send('Invalid value for max');
            return;
        }
        const cat = await createCateogry(name, max);
        res.status(200).json(cat);
    });

games.post('/:slug/generation', async (req, res) => {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }

    const { slug } = req.params;

    if (!isOwner(slug, req.session.user)) {
        res.sendStatus(403);
        return;
    }

    const categories = await getCategories(slug);
    const { schema } = makeGeneratorSchema(
        categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            max: cat.max,
            goalCount: cat._count.goals,
        })) ?? [],
    );

    const parseResult = schema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json(parseResult.error);
        return;
    }

    const result = await updateGeneratorSettings(slug, parseResult.data);
    res.status(200).send(result);
});

games.get('/:slug/sampleBoard', async (req, res) => {
    const { slug } = req.params;
    const { variant } = req.query;

    const gameData = await gameForSlug(slug);
    if (!gameData) {
        res.sendStatus(404);
        return;
    }
    if (!gameData.newGeneratorBeta) {
        res.status(400).send(
            `${gameData.name} is not using the PlayBingo generator framework.`,
        );
        return;
    }

    let variantData;
    if (variant) {
        if (typeof variant === 'string') {
            variantData = await getVariant(variant);
        } else {
            res.status(400).send('Invalid variant parameter');
            return;
        }
        if (!variantData) {
            res.sendStatus(404);
            return;
        }
        if (variantData.gameId !== gameData.id) {
            res.sendStatus(404);
            return;
        }
    }

    const goals = await goalsForGame(slug);
    const categories = await getCategories(slug);

    let generator: BoardGenerator;
    if (variantData) {
        generator = new BoardGenerator(
            goals,
            categories,
            variantData.generatorSettings,
        );
    } else {
        generator = new BoardGenerator(
            goals,
            categories,
            gameData.generatorSettings,
        );
    }

    try {
        generator.generateBoard();
    } catch (e) {
        if (e instanceof GenerationFailedError) {
            res.status(422).send(e.message);
            return;
        }
        res.status(500).send(`An unknown generation error occurred - ${e}`);
    }
    res.status(200).send({
        board: generator.board.map((row) =>
            row.map((goal) => ({
                id: goal.id,
                goal: goal.goal,
                description: goal.description,
                categories: goal.categories,
                difficulty: goal.difficulty,
            })),
        ),
        width: generator.board[0].length,
        height: generator.board.length,
        seed: generator.seed,
        variant: variantData ? variantData.name : undefined,
    });
});

games.use(variants);

export default games;
