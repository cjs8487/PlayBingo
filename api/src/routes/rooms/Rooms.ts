import { randomInt } from 'crypto';
import { Router } from 'express';
import { createRoomToken } from '../../auth/RoomAuth';
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
import { gameForSlug, goalCount } from '../../database/games/Games';
import { chunk } from '../../util/Array';
import actions from './Actions';
import { logWarn } from '../../Logger';
import { randomWord, slugAdjectives, slugNouns } from '../../util/Words';

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
        /*variant,*/ mode,
        lineCount,
        generationMode,
        difficulty,
        hideCard,
        seed,
        spectator,
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

    const dbRoom = await createRoom(
        slug,
        name,
        gameData.id,
        false,
        password,
        hideCard,
        mode,
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
    );
    const options: BoardGenerationOptions = {
        mode: BoardGenerationMode.RANDOM,
    } as BoardGenerationOptions; // necessary cast to avoid auto-narrowing
    let useDefault = true;
    if (generationMode) {
        options.mode = generationMode as BoardGenerationMode;
        if (options.mode === BoardGenerationMode.DIFFICULTY) {
            if (difficulty) {
                options.difficulty = difficulty;
                useDefault = false;
            } else {
                logWarn(
                    `Unable to generate using dificulty variants for ${slug}, falling back to default mode.`,
                );
            }
        } else {
            useDefault = false;
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
    await room.generateBoard(options);
    allRooms.set(slug, room);

    const token = createRoomToken(room, {
        isSpectating: spectator,
        isMonitor: true,
    });

    res.status(200).json({ slug, authToken: token });
});

rooms.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    if (allRooms.get(slug)) {
        res.sendStatus(200);
        return;
    }
    const dbRoom = await getRoomFromSlug(slug);
    if (!dbRoom) {
        res.sendStatus(404);
        return;
    }
    const room = new Room(
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
        dbRoom.racetimeRoom ?? '',
    );
    room.board = {
        board: chunk(
            dbRoom.board.map((goal) => ({
                goal: goal.split('::')[0],
                description: goal.split('::', 2)[1] ?? '',
                colors: [],
            })),
            5,
        ),
    };
    dbRoom.history.forEach((action) => {
        const { nickname, color, newColor, oldColor, row, col, message } =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            action.payload as any;
        switch (action.action) {
            case 'JOIN':
                room.sendChat([{ contents: nickname, color }, ' has joined.']);
                break;
            case 'LEAVE':
                room.sendChat([{ contents: nickname, color }, ' has left.']);
                break;
            case 'MARK':
                if (room.board.board[row][col].colors.includes(color)) return;
                room.board.board[row][col].colors.push(color);
                room.board.board[row][col].colors.sort((a, b) =>
                    a.localeCompare(b),
                );
                room.sendCellUpdate(row, col);
                room.sendChat([
                    {
                        contents: nickname,
                        color: color,
                    },
                    ` is marking (${row},${col})`,
                ]);
                break;
            case 'UNMARK':
                room.board.board[row][col].colors = room.board.board[row][
                    col
                ].colors.filter((c) => c !== color);
                room.sendCellUpdate(row, col);
                room.sendChat([
                    { contents: nickname, color: color },
                    ` is unmarking (${row},${col})`,
                ]);
                break;
            case 'CHAT':
                room.sendChat(`${nickname}: ${message}`);
                break;
            case 'CHANGECOLOR':
                room.sendChat([
                    { contents: nickname, color: oldColor },
                    ' has changed their color to ',
                    { contents: color, color: newColor },
                ]);
                break;
        }
    });
    allRooms.set(slug, room);
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

    const token = createRoomToken(room, { isSpectating: spectator });
    res.status(200).send({ authToken: token });
});

rooms.use('/actions', actions);

export default rooms;
