import { Router } from 'express';
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
    isModerator,
    isOwner,
    removeModerator,
    removeOwner,
    unfavoriteGame,
    updateDifficultyGroups,
    updateDifficultyVariant,
    updateDifficultyVariantsEnabled,
    updateGameCover,
    updateGameName,
    updateRacetimeCategory,
    updateRacetimeGoal,
    updateSlugWords,
    updateSRLv5Enabled,
    updateUseTypedRandom,
} from '../../database/games/Games';
import {
    createGoal,
    goalsForGame,
    deleteAllGoalsForGame,
    goalsForGameFull,
} from '../../database/games/Goals';
import { getUser, getUsersEligibleToModerateGame } from '../../database/Users';
import {
    createCateogry,
    getCategories,
} from '../../database/games/GoalCategories';
import { saveFile } from '../../media/MediaServer';

const games = Router();

games.get('/', async (req, res) => {
    const result = await allGames(req.session.user);
    res.status(200).json(result);
});

games.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    const result = await gameForSlug(slug);
    if (result) {
        res.status(200).json(result);
    } else {
        res.sendStatus(404);
    }
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
    } = req.body;

    let result = undefined;
    if (name) {
        result = await updateGameName(slug, name);
    }
    if (coverImage) {
        result = await updateGameCover(slug, coverImage);
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

export default games;
