import { pbkdf2Sync, randomBytes } from 'crypto';
import {
    GenerationBoardLayout,
    GenerationGoalRestriction,
    GenerationGoalSelection,
    PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database');

    console.log('Creating users');
    await prisma.user.deleteMany();
    const salt = randomBytes(16);
    const passwordHash = pbkdf2Sync('password', salt, 10000, 64, 'sha256');
    const staff = await prisma.user.upsert({
        where: { email: 'staff@playbingo.gg' },
        update: {},
        create: {
            email: 'staff@playbingo.gg',
            username: 'staff',
            password: passwordHash,
            salt: salt,
            staff: true,
        },
    });
    const owner = await prisma.user.upsert({
        where: { email: 'owner@playbingo.gg' },
        update: {},
        create: {
            email: 'owner@playbingo.gg',
            username: 'owner',
            password: passwordHash,
            salt: salt,
        },
    });
    const mod = await prisma.user.upsert({
        where: { email: 'mod@playbingo.gg' },
        update: {},
        create: {
            email: 'mod@playbingo.gg',
            username: 'mod',
            password: passwordHash,
            salt: salt,
        },
    });
    const player = await prisma.user.upsert({
        where: { email: 'player@playbingo.gg' },
        update: {},
        create: {
            email: 'player@playbingo.gg',
            username: 'player',
            password: passwordHash,
            salt: salt,
        },
    });
    console.log(staff, owner, mod, player);

    console.log('Creating games and goals');
    await prisma.category.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.game.deleteMany();

    const categories = [
        'Category 1',
        'Category 2',
        'Category 3',
        'Category 4',
        'Category 5',
    ];

    const game1 = await prisma.game.create({
        data: {
            name: '25 Goals and No Difficulties',
            slug: 'nodiff',
            enableSRLv5: false,
            racetimeBeta: false,
            owners: { connect: [{ id: staff.id }, { id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
            usersFavorited: {
                connect: [
                    { id: staff.id },
                    { id: owner.id },
                    { id: player.id },
                ],
            },
        },
    });
    await prisma.category.createMany({
        data: categories.map((cat) => ({
            gameId: game1.id,
            name: cat,
        })),
    });
    await Promise.all(
        Array.from({ length: 25 }).map((_, i) =>
            prisma.goal.create({
                data: {
                    gameId: game1.id,
                    goal: `Goal ${i + 1}`,
                    description: `Description for Goal ${i + 1}`,
                    categories: {
                        connect: {
                            gameId_name: {
                                gameId: game1.id,
                                name: categories[i % categories.length],
                            },
                        },
                    },
                },
            }),
        ),
    );

    const game2 = await prisma.game.create({
        data: {
            name: 'SRLv5 25 Goals',
            slug: 'srl25',
            enableSRLv5: true,
            racetimeBeta: false,
            owners: { connect: [{ id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
            generationBoardLayout: GenerationBoardLayout.SRLv5,
            generationGoalRestrictions: [
                GenerationGoalRestriction.LINE_TYPE_EXCLUSION,
            ],
        },
    });
    await prisma.category.createMany({
        data: categories.map((cat) => ({
            gameId: game2.id,
            name: cat,
        })),
    });
    await Promise.all(
        Array.from({ length: 25 }).map((_, i) =>
            prisma.goal.create({
                data: {
                    gameId: game2.id,
                    goal: `Goal ${i + 1}`,
                    description: `Description for Goal ${i + 1}`,
                    categories: {
                        connect: {
                            gameId_name: {
                                gameId: game2.id,
                                name: categories[i % categories.length],
                            },
                        },
                    },
                    difficulty: (i % 25) + 1,
                },
            }),
        ),
    );

    const game3 = await prisma.game.create({
        data: {
            name: 'SRLv5 50',
            slug: 'srl50',
            enableSRLv5: false,
            racetimeBeta: false,
            owners: { connect: [{ id: staff.id }, { id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
            usersFavorited: { connect: [{ id: owner.id }, { id: mod.id }] },
        },
    });
    await prisma.category.createMany({
        data: categories.map((cat) => ({
            gameId: game3.id,
            name: cat,
        })),
    });
    await Promise.all(
        Array.from({ length: 50 }).map((_, i) =>
            prisma.goal.create({
                data: {
                    gameId: game3.id,
                    goal: `Goal ${i + 1}`,
                    description: `Description for Goal ${i + 1}`,
                    categories: {
                        connect: {
                            gameId_name: {
                                gameId: game3.id,
                                name: categories[i % categories.length],
                            },
                        },
                    },
                    difficulty: (i % 25) + 1,
                },
            }),
        ),
    );

    const game4 = await prisma.game.create({
        data: {
            name: 'SRLv5 100',
            slug: 'srl100',
            enableSRLv5: true,
            racetimeBeta: false,
            owners: { connect: [{ id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
        },
    });
    await prisma.category.createMany({
        data: categories.map((cat) => ({
            gameId: game4.id,
            name: cat,
        })),
    });
    await Promise.all(
        Array.from({ length: 100 }).map((_, i) =>
            prisma.goal.create({
                data: {
                    gameId: game4.id,
                    goal: `Goal ${i + 1}`,
                    description: `Description for Goal ${i + 1}`,
                    categories: {
                        connect: {
                            gameId_name: {
                                gameId: game4.id,
                                name: categories[i % categories.length],
                            },
                        },
                    },
                    difficulty: (i % 25) + 1,
                },
            }),
        ),
    );

    const game5 = await prisma.game.create({
        data: {
            name: 'SRLv5 250',
            slug: 'srl250',
            enableSRLv5: true,
            racetimeBeta: false,
            owners: { connect: [{ id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
            usersFavorited: { connect: [{ id: mod.id }, { id: player.id }] },
        },
    });
    await prisma.category.createMany({
        data: categories.map((cat) => ({
            gameId: game5.id,
            name: cat,
        })),
    });
    await Promise.all(
        Array.from({ length: 250 }).map((_, i) =>
            prisma.goal.create({
                data: {
                    gameId: game5.id,
                    goal: `Goal ${i + 1}`,
                    description: `Description for Goal ${i + 1}`,
                    categories: {
                        connect: {
                            gameId_name: {
                                gameId: game5.id,
                                name: categories[i % categories.length],
                            },
                        },
                    },
                    difficulty: (i % 25) + 1,
                },
            }),
        ),
    );

    const realisticCategories = [
        'Movement',
        'Combat',
        'Exploration',
        'Puzzle',
        'Collecting',
        'Time Challenge',
        'Stealth',
        'Resource Management',
        'Story Progression',
        'Boss Battle',
    ];
    const realisticGoals = (id: string) => [
        {
            gameId: id,
            goal: 'Collect 100 Coins',
            description: 'Gather 100 coins from various levels.',
            categories: {
                connect: ['Collecting'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 3,
        },
        {
            gameId: id,
            goal: 'Defeat the Fire Dragon',
            description: 'Slay the Fire Dragon in the Volcano Dungeon.',
            categories: {
                connect: ['Combat', 'Boss Battle'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 15,
        },
        {
            gameId: id,
            goal: 'Find 3 Hidden Keys',
            description: 'Locate 3 keys hidden throughout the forest.',
            categories: {
                connect: ['Exploration', 'Puzzle'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 8,
        },
        {
            gameId: id,
            goal: 'Solve the Ancient Temple Puzzle',
            description: 'Unlock the secret chamber in the temple.',
            categories: {
                connect: ['Puzzle'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 10,
        },
        {
            gameId: id,
            goal: 'Craft a Health Potion',
            description: 'Use herbs and water to craft a basic health potion.',
            categories: {
                connect: ['Resource Management'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 5,
        },
        {
            gameId: id,
            goal: 'Complete the Speedrun Trial',
            description: 'Finish the speedrun course in under 3 minutes.',
            categories: {
                connect: ['Time Challenge'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 20,
        },
        {
            gameId: id,
            goal: 'Pickpocket a Guard',
            description: 'Steal a gold coin from a guard without being caught.',
            categories: {
                connect: ['Stealth'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 7,
        },
        {
            gameId: id,
            goal: 'Reach Level 10',
            description: 'Gain experience and reach level 10.',
            categories: {
                connect: ['Story Progression'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 4,
        },
        {
            gameId: id,
            goal: 'Defeat 50 Enemies',
            description: 'Eliminate 50 enemies to prove your strength.',
            categories: {
                connect: ['Combat'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 12,
        },
        {
            gameId: id,
            goal: 'Cross the Lava Pit',
            description: 'Use platforms to cross the lava pit safely.',
            categories: {
                connect: ['Movement', 'Puzzle'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 14,
        },
        {
            gameId: id,
            goal: 'Rescue the Lost Villager',
            description: 'Find and rescue a villager trapped in the cave.',
            categories: {
                connect: ['Exploration', 'Story Progression'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 6,
        },
        {
            gameId: id,
            goal: 'Gather 10 Rare Herbs',
            description: 'Collect rare herbs from the mountain region.',
            categories: {
                connect: ['Collecting', 'Resource Management'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 9,
        },
        {
            gameId: id,
            goal: 'Defeat the Ice Golem',
            description: 'Defeat the Ice Golem in the Frozen Cavern.',
            categories: {
                connect: ['Combat', 'Boss Battle'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 18,
        },
        {
            gameId: id,
            goal: 'Escape the Dungeon Maze',
            description: 'Navigate and escape the maze in the dungeon.',
            categories: {
                connect: ['Puzzle', 'Exploration'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 13,
        },
        {
            gameId: id,
            goal: 'Solve the Color Matching Puzzle',
            description: 'Match colors correctly to unlock the gate.',
            categories: {
                connect: ['Puzzle'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 8,
        },
        {
            gameId: id,
            goal: 'Survive the Night in the Forest',
            description: 'Survive until morning without getting caught.',
            categories: {
                connect: ['Stealth', 'Time Challenge'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 19,
        },
        {
            gameId: id,
            goal: 'Gather 20 Crystals',
            description: 'Mine 20 crystals from the underground cave.',
            categories: {
                connect: ['Collecting'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 5,
        },
        {
            gameId: id,
            goal: 'Win a Duel',
            description: 'Defeat an enemy in a 1v1 duel.',
            categories: {
                connect: ['Combat'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 17,
        },
        {
            gameId: id,
            goal: 'Repair the Broken Bridge',
            description: 'Find materials and repair the bridge.',
            categories: {
                connect: ['Resource Management', 'Exploration'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 11,
        },
        {
            gameId: id,
            goal: 'Climb the Tower of Trials',
            description: 'Reach the top of the Tower of Trials.',
            categories: {
                connect: ['Movement', 'Story Progression'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 21,
        },
        {
            gameId: id,
            goal: 'Find the Golden Sword',
            description: 'Retrieve the legendary Golden Sword.',
            categories: {
                connect: ['Exploration'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 16,
        },
        {
            gameId: id,
            goal: 'Complete the Puzzle Gauntlet',
            description: 'Solve a series of puzzles back-to-back.',
            categories: {
                connect: ['Puzzle'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 23,
        },
        {
            gameId: id,
            goal: 'Steal a Rare Artifact',
            description: 'Steal an artifact from the museum undetected.',
            categories: {
                connect: ['Stealth', 'Resource Management'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 22,
        },
        {
            gameId: id,
            goal: 'Defeat the Dark Lord',
            description: 'Defeat the final boss and save the kingdom.',
            categories: {
                connect: ['Combat', 'Boss Battle'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 25,
        },
        {
            gameId: id,
            goal: 'Find and Open 10 Treasure Chests',
            description: 'Locate and open 10 treasure chests.',
            categories: {
                connect: ['Collecting'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 10,
        },
        {
            gameId: id,
            goal: 'Survive the Arena for 5 Rounds',
            description: 'Defeat all enemies across 5 rounds in the arena.',
            categories: {
                connect: ['Combat', 'Time Challenge'].map((cat) => ({
                    gameId_name: {
                        gameId: id,
                        name: cat,
                    },
                })),
            },
            difficulty: 24,
        },
        ...Array.from({ length: 54 }).map((_, i) => ({
            gameId: id,
            goal: `Side Quest ${i + 27}`,
            description: `Complete side quest number ${
                i + 27
            } for extra rewards.`,
            categories: {
                connect: {
                    gameId_name: {
                        gameId: id,
                        name: realisticCategories[
                            i % realisticCategories.length
                        ],
                    },
                },
            },
            difficulty: ((i + 1) % 25) + 1,
        })),
    ];

    const game6 = await prisma.game.create({
        data: {
            name: 'Epic Adventure Bingo',
            slug: 'epic',
            enableSRLv5: true,
            racetimeBeta: false,
            owners: { connect: [{ id: staff.id }, { id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
            usersFavorited: { connect: [{ id: staff.id }, { id: player.id }] },
            slugWords: [
                'anchor',
                'antelope',
                'archer',
                'armor',
                'aspen',
                'avalanche',
                'banyan',
                'barricade',
                'beacon',
                'beetle',
                'blizzard',
                'bonfire',
                'brook',
                'canyon',
                'caravan',
                'catapult',
                'celestial',
                'centaur',
                'chimera',
                'citadel',
                'cliff',
                'conifer',
                'constellation',
                'coral',
                'cottage',
                'crater',
                'crocodile',
                'cyclone',
                'dandelion',
                'dawn',
                'debris',
                'delta',
                'descent',
                'ember',
                'fjord',
                'fortress',
                'geyser',
                'goblin',
                'granite',
                'grove',
                'hammock',
                'haven',
                'hive',
                'hurricane',
                'jungle',
                'kaleidoscope',
                'lagoon',
                'lilac',
                'meadowlark',
                'mesa',
                'mirage',
                'mosaic',
                'nexus',
                'oasis',
                'prairie',
                'quarry',
                'reef',
                'ridge',
                'savanna',
                'summit',
                'tundra',
            ],
            generationBoardLayout: GenerationBoardLayout.SRLv5,
            generationGoalRestrictions: [
                GenerationGoalRestriction.LINE_TYPE_EXCLUSION,
            ],
            generationGoalSelection: GenerationGoalSelection.DIFFICULTY,
        },
    });
    await prisma.category.createMany({
        data: realisticCategories.map((cat) => ({
            gameId: game6.id,
            name: cat,
        })),
    });
    await Promise.all(
        realisticGoals(game6.id).map((g) => prisma.goal.create({ data: g })),
    );
    console.log(game1, game2, game3, game4, game5, game6);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
