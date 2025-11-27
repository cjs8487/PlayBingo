import { randomInt } from 'crypto';
import { Router } from 'express';
import { logError, logInfo, logWarn } from '../../Logger';
import { createRoomToken, verifyRoomToken } from '../../auth/RoomAuth';
import Room, {
    BoardGenerationMode,
    BoardGenerationOptions,
} from '../../core/Room';
import { allRooms } from '../../core/RoomServer';
import {
    createRoom,
    getFullRoomList,
    getRoomFromSlug,
} from '../../database/Rooms';
import {
    gameForSlug,
    getDifficultyVariant,
    goalCount,
} from '../../database/games/Games';
import { chunk } from '../../util/Array';
import { randomWord, slugAdjectives, slugNouns } from '../../util/Words';
import { handleAction } from './actions/Actions';
import { getGoalList } from '../../database/games/Goals';
import { RoomData } from '@playbingo/types';
import Player from '../../core/Player';
import { GeneratorSettings, makeGeneratorSchema } from '@playbingo/shared';
import { getCategories } from '../../database/games/GoalCategories';
import { getVariant } from '../../database/games/Variants';
import { DifficultyVariant, Variant } from '@prisma/client';
import { GenerationFailedError } from '../../core/generation/GenerationFailedError';

const MIN_ROOM_GOALS_REQUIRED = 25;
const rooms = Router();

rooms.get('/', async (req, res) => {
    const { inactive } = req.query;

    const roomList: { name: string; game: string; slug: string }[] = [];
    if (!inactive) {
        allRooms.forEach((room, key) => {
            roomList.push({ name: room.name, game: room.game, slug: key });
        });
        res.send(roomList);
    } else {
        res.json(
            (await getFullRoomList()).map((room) => ({
                name: room.name,
                game: room.game?.name ?? 'Deleted Game',
                slug: room.slug,
            })),
        );
    }
});

rooms.post('/', async (req, res) => {
    const {
        name,
        game,
        nickname,
        password,
        variant,
        mode,
        lineCount,
        generationMode,
        hideCard,
        seed,
        spectator,
        exploration,
        explorationStart,
        explorationStartCount,
    } = req.body;

    if (!name || !game || !nickname /*|| !variant || !mode*/) {
        res.status(400).send('Missing required element(s).');
        return;
    }

    const gameData = await gameForSlug(game);
    if (!gameData) {
        res.sendStatus(404);
        return;
    }

    // Might be better as a frontend check, but also way more imperformant
    const goalsNumber = await goalCount(game);

    if (goalsNumber < MIN_ROOM_GOALS_REQUIRED) {
        res.status(400).send(
            `Game has less than the minimum amount of goals required for room creation (${MIN_ROOM_GOALS_REQUIRED}).`,
        );
        return;
    }

    const adj = randomWord(slugAdjectives);
    const noun = randomWord(
        gameData.slugWords.length > 0 ? gameData.slugWords : slugNouns,
    );
    const num = randomInt(1000, 10000);
    const slug = `${adj}-${noun}-${num}`;

    let generatorSettings: GeneratorSettings | undefined = undefined;
    let isDifficultyVariant = false;
    let variantName = '';
    if (gameData.newGeneratorBeta) {
        const { schema } = makeGeneratorSchema(
            ((await getCategories(gameData.slug)) ?? []).map((cat) => ({
                id: cat.id,
                name: cat.name,
                max: cat.max,
                goalCount: cat._count.goals,
            })),
        );
        let result = undefined;
        if (variant) {
            let variantData;

            variantData = await getDifficultyVariant(variant);
            if (variantData) {
                if (variantData.gameId !== gameData.id) {
                    res.status(400).send('Invalid variant selected.');
                    return;
                }
                generatorSettings = undefined;
                isDifficultyVariant = true;
                variantName = variantData.name;
            } else {
                variantData = await getVariant(variant);
                if (!variantData || variantData.gameId !== gameData.id) {
                    res.status(400).send('Invalid variant selected.');
                    return;
                }
                result = schema.safeParse(variantData.generatorSettings);
                variantName = variantData.name;
            }
        } else {
            result = schema.safeParse(gameData.generatorSettings);
            variantName = 'Normal';
        }
        if (result) {
            if (!result.success) {
                logError(
                    `Invalid generator config in database for ${gameData.name} (${gameData.slug} ${variant ? variant : ''})`,
                );
                res.status(500).send('Invalid generator configuration.');
                return;
            }
            generatorSettings = result.data;
        }
    } else if (variant) {
        // difficulty variant on a game not enabled for new generator
        const difficultyVariant = await getDifficultyVariant(variant);
        if (!difficultyVariant || difficultyVariant.gameId !== gameData.id) {
            res.status(400).send('Invalid variant selected.');
        }
        generatorSettings = undefined;
        isDifficultyVariant = true;
    }

    const dbRoom = await createRoom(
        slug,
        name,
        gameData.id,
        false,
        password,
        hideCard,
        mode,
        lineCount,
        isDifficultyVariant ? undefined : variant,
        exploration
            ? explorationStart === 'RANDOM'
                ? `${explorationStartCount}`
                : explorationStart
            : undefined,
    );
    const room = new Room(
        name,
        gameData.name,
        game,
        slug,
        password,
        dbRoom.id,
        hideCard,
        mode,
        lineCount,
        gameData.racetimeBeta &&
            !!gameData.racetimeCategory &&
            !!gameData.racetimeGoal,
        variantName,
        exploration
            ? explorationStart === 'RANDOM'
                ? explorationStartCount
                : explorationStart
            : undefined,
        '',
        generatorSettings,
    );
    const options: BoardGenerationOptions = {
        mode: BoardGenerationMode.RANDOM,
    } as BoardGenerationOptions; // necessary cast to avoid auto-narrowing
    let useDefault = true;
    if (isDifficultyVariant) {
        if (isDifficultyVariant) {
            options.mode = BoardGenerationMode.DIFFICULTY;
        }
        //needed to force narrowing
        if (options.mode === BoardGenerationMode.DIFFICULTY) {
            if (variant) {
                options.difficulty = variant;
                useDefault = false;
            } else {
                logWarn(
                    `Unable to generate using difficulty variants for ${slug}, falling back to default mode.`,
                );
            }
        }
    }
    if (useDefault) {
        if (gameData.enableSRLv5) {
            options.mode = BoardGenerationMode.SRLv5;
        } else {
            options.mode = BoardGenerationMode.RANDOM;
        }
    }

    options.seed = seed;
    try {
        await room.generateBoard(options);
    } catch (e) {
        if (e instanceof GenerationFailedError) {
            res.status(422).send(e.message);
            return;
        }
        res.status(500).send(`An unknown generation error occurred - ${e}`);
        return;
    }
    allRooms.set(slug, room);

    const token = createRoomToken(
        room,
        {
            isSpectating: spectator,
            isMonitor: true,
        },
        req.session.user ?? req.session.id,
        req.session.user,
    );

    res.status(200).json({ slug, authToken: token });
});

async function getOrLoadRoom(slug: string): Promise<Room | null> {
    let room = allRooms.get(slug);
    if (room) return room;

    const dbRoom = await getRoomFromSlug(slug);
    if (!dbRoom) return null;

    let variant: Variant | DifficultyVariant | null = null;
    let variantName = '';
    if (dbRoom.variantId) {
        variant = await getVariant(dbRoom.variantId);
        if (!variant) {
            variant = await getDifficultyVariant(dbRoom.variantId);
        }
        if (variant) {
            variantName = variant.name;
        } else {
            variantName = 'Unknown Variant';
        }
    } else {
        variantName = 'Normal';
    }

    let generatorSettings: GeneratorSettings | undefined = undefined;
    if (dbRoom.game?.newGeneratorBeta) {
        if (
            variant &&
            'generatorSettings' in variant &&
            variant.generatorSettings
        ) {
            generatorSettings = variant.generatorSettings;
        } else {
            generatorSettings = dbRoom.game.generatorSettings;
        }
    }

    const newRoom = new Room(
        dbRoom.name,
        dbRoom.game?.name ?? 'Deleted Game',
        dbRoom.game?.slug ?? '',
        dbRoom.slug,
        dbRoom.password ?? '',
        dbRoom.id,
        dbRoom.hideCard,
        dbRoom.bingoMode,
        dbRoom.lineCount,
        (dbRoom.game?.racetimeBeta &&
            !!dbRoom.game.racetimeCategory &&
            !!dbRoom.game.racetimeGoal) ||
            !!dbRoom.racetimeRoom,
        variantName,
        dbRoom.explorationStart ?? undefined,
        dbRoom.racetimeRoom ?? '',
        generatorSettings,
    );

    if (generatorSettings?.boardLayout.mode === 'custom') {
        newRoom.board = chunk(
            (await getGoalList(dbRoom.board)).map((goal) => ({
                goal: goal,
                completedPlayers: [],
                revealed: true,
            })),
            generatorSettings.boardLayout.layout[0].length,
        );
    } else {
        newRoom.board = chunk(
            (await getGoalList(dbRoom.board)).map((goal) => ({
                goal: goal,
                completedPlayers: [],
                revealed: true,
            })),
            5,
        );
    }

    dbRoom.players.forEach((dbPlayer) => {
        const player = new Player(
            newRoom,
            dbPlayer.key,
            dbPlayer.nickname,
            dbPlayer.color,
            dbPlayer.spectator,
            dbPlayer.monitor,
            dbPlayer.userId ?? undefined,
        );
        newRoom.players.set(player.id, player);
    });

    dbRoom.history.forEach((action) => {
        const {
            nickname,
            color,
            newColor,
            oldColor,
            row,
            col,
            message,
            player: playerId,
        } = action.payload as any;

        const player = newRoom.players.get(playerId)!;

        switch (action.action) {
            case 'JOIN':
                newRoom.sendChat([
                    { contents: nickname, color },
                    ' has joined.',
                ]);
                break;
            case 'LEAVE':
                newRoom.sendChat([{ contents: nickname, color }, ' has left.']);
                break;
            case 'MARK':
                if (!player.hasMarked(row, col)) {
                    newRoom.board[row][col].completedPlayers.push(playerId);
                    newRoom.board[row][col].completedPlayers.sort((a, b) =>
                        a.localeCompare(b),
                    );
                    player.mark(row, col);
                    newRoom.sendCellUpdate(row, col);
                    newRoom.sendChat([
                        { contents: player.nickname, color: player.color },
                        ` marked ${newRoom.board[row][col].goal.goal} (${row},${col})`,
                    ]);
                }
                break;
            case 'UNMARK':
                if (player.hasMarked(row, col)) {
                    newRoom.board[row][col].completedPlayers = newRoom.board[
                        row
                    ][col].completedPlayers.filter((p) => p !== playerId);
                    player.unmark(row, col);
                    newRoom.sendCellUpdate(row, col);
                    newRoom.sendChat([
                        { contents: player.nickname, color: player.color },
                        ` unmarked ${newRoom.board[row][col].goal.goal} (${row},${col})`,
                    ]);
                }
                break;
            case 'CHAT':
                newRoom.sendChat(`${nickname}: ${message}`);
                break;
            case 'CHANGECOLOR':
                newRoom.sendChat([
                    { contents: nickname, color: oldColor },
                    ' has changed their color to ',
                    { contents: newColor, color: newColor },
                ]);
                break;
        }
    });

    allRooms.set(slug, newRoom);
    return newRoom;
}

rooms.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    const room = await getOrLoadRoom(slug);

    if (!room) {
        res.sendStatus(404);
        return;
    }

    const roomData: RoomData = {
        game: room.game,
        slug: room.slug,
        name: room.name,
        gameSlug: room.gameSlug,
        newGenerator: room.newGenerator,
        racetimeConnection: {
            gameActive: room.racetimeEligible,
            url: room.raceHandler.url,
            startDelay: room.raceHandler.data?.start_delay,
            started: room.raceHandler.data?.started_at ?? undefined,
            ended: room.raceHandler.data?.ended_at ?? undefined,
            status: room.raceHandler.data?.status.verbose_value,
        },
        mode: room.bingoMode,
        variant: room.variantName,
    };

    const userKey = req.session.user ?? req.session.id;
    const perms = await room.canAutoAuthenticate(userKey, !req.session.user);
    if (perms) {
        roomData.token = createRoomToken(
            room,
            perms,
            req.session.user ?? req.session.id,
            req.session.user,
        );
    }

    res.status(200).json(roomData);
});

rooms.post('/:slug/authorize', (req, res) => {
    const { slug } = req.params;
    const { password, spectator } = req.body;
    const room = allRooms.get(slug);
    if (!room) {
        res.sendStatus(404);
        return;
    }
    if (password !== room.password) {
        res.sendStatus(403);
        return;
    }

    const token = createRoomToken(
        room,
        {
            isSpectating: spectator,
        },
        req.session.user ?? req.session.id,
        req.session.user,
    );
    res.status(200).send({ authToken: token });
});

rooms.post('/:slug/actions', async (req, res) => {
    const { slug } = req.params;
    const { authToken, action } = req.body;

    if (!req.session.user) {
        logWarn(`Unauthorized action request ${action}`);
        res.sendStatus(401);
        return;
    }

    if (!authToken) {
        logInfo(`Malformed action body request - missing authToken`);
        res.status(400).send('Missing required body parameter');
        return;
    }

    const room = allRooms.get(slug);
    if (!room) {
        logInfo(`Unable to find room to take action on`);
        res.sendStatus(404);
        return;
    }

    const authPayload = verifyRoomToken(authToken, slug);
    if (!authPayload) {
        room.logWarn(`Unauthorized action request`);
        res.sendStatus(403);
        return;
    }

    const result = await handleAction(
        room,
        action,
        req.session.user,
        authPayload,
    );

    res.status(result.code);
    if ('message' in result) {
        res.send(result.message);
    } else {
        res.json(result.value);
    }
});

export default rooms;
