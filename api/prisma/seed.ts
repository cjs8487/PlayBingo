import { pbkdf2Sync, randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import type { GeneratorSettings } from '@playbingo/shared';

const generatorSettings = (
    boardLayout: GeneratorSettings['boardLayout'] = { mode: 'random' },
    goalFilters: GeneratorSettings['goalFilters'] = [],
): GeneratorSettings => ({
    goalFilters,
    goalTransformation: [],
    boardLayout,
    restrictions: [{ type: 'line-type-exclusion' }],
    adjustments: [],
});
const expeditionLayout = (
    size: number,
    height: number = size,
): GeneratorSettings['boardLayout'] => ({
    mode: 'custom',
    layout: Array.from({ length: height }, () =>
        Array.from({ length: size }, () => ({ selectionCriteria: 'random' })),
    ),
});

export async function main(prisma: PrismaClient) {
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
    await prisma.variant.deleteMany();
    await prisma.difficultyVariant.deleteMany();
    await prisma.category.deleteMany();
    await prisma.goalTag.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.game.deleteMany();

    const categories = [
        'Exploration',
        'Combat',
        'Collecting',
        'Puzzle',
        'Movement',
    ];
    const games = [
        {
            name: 'Meadow Picnic',
            slug: 'meadow',
            description: 'An afternoon of simple outdoor adventures.',
            settings: generatorSettings(),
            goals: [
                'Pack a Picnic Basket',
                'Find a Four-Leaf Clover',
                'Fly a Kite',
                'Share Lemonade',
            ].map((goal) => ({
                goal,
                description: `Enjoy the meadow and ${goal.toLowerCase()}.`,
            })),
        },
        {
            name: 'Crystal Caverns',
            slug: 'caverns',
            description:
                'Descend through the caverns, gathering crystals and unlocking ancient chambers.',
            settings: generatorSettings({ mode: 'srlv5' }),
            goals: Array.from({ length: 25 }, (_, i) => ({
                goal: `Unlock Crystal Chamber ${i + 1}`,
                description: `Find the crystal key and solve the guardian puzzle in chamber ${i + 1}.`,
                difficulty: i + 1,
            })),
        },
        {
            name: 'Lantern Festival',
            slug: 'lanterns',
            description:
                'Explore the village festival, help the stallholders, and enjoy the celebrations.',
            settings: generatorSettings(),
            goals: [
                'Market Square',
                'Riverbank',
                'Temple Gardens',
                'Old Town',
            ].flatMap((place) =>
                [
                    'Light a Lantern',
                    'Win a Ring Toss',
                    'Share a Festival Meal',
                    'Find a Lost Keepsake',
                    'Watch the Fireworks',
                    'Help a Stallholder',
                ].map((activity) => ({
                    goal: `${activity} at ${place}`,
                    description: `Visit ${place} during the lantern festival and ${activity.toLowerCase()}.`,
                })),
            ),
        },
        {
            name: 'The Binding of Isaac',
            slug: 'isaac',
            description:
                'Explore the floors, collect items and defeat bosses using the classic Isaac layout.',
            settings: generatorSettings({ mode: 'isaac' }),
            goals: [
                'Basement I',
                'Basement II',
                'Caves I',
                'Caves II',
                'Depths I',
                'Depths II',
                'Cellar I',
                'Cellar II',
                'Catacombs I',
                'Catacombs II',
            ].flatMap((floor) =>
                [
                    'Defeat the Boss',
                    'Find the Secret Room',
                    'Buy a Shop Item',
                    'Open a Golden Chest',
                    'Clear a Challenge Room',
                    'Collect a Soul Heart',
                    'Find the Treasure Room',
                    'Destroy a Tinted Rock',
                    'Use an Active Item',
                    'Complete a Room Without Damage',
                ].map((challenge, i) => ({
                    goal: `${challenge} in ${floor}`,
                    description: `${challenge} before leaving ${floor}.`,
                    difficulty: (i % 4) + 1,
                })),
            ),
        },
        {
            name: "Cartographer's Journey",
            slug: 'cartographer',
            description:
                'Chart distant lands and record the landmarks of an expanding world.',
            settings: generatorSettings({ mode: 'srlv5' }),
            goals: Array.from({ length: 250 }, (_, i) => ({
                goal: `${['Map the Coastline', 'Survey the Ruins', 'Discover a Mountain Pass', 'Chart a River', 'Visit the Watchtower'][i % 5]} in Province ${Math.floor(i / 5) + 1}`,
                description: `Complete your survey of province ${Math.floor(i / 5) + 1} and add it to the royal atlas.`,
                difficulty: (i % 225) + 1,
            })),
        },
    ];
    for (const entry of games) {
        const game = await prisma.game.create({
            data: {
                name: entry.name,
                slug: entry.slug,
                descriptionMd: entry.description,
                newGeneratorBeta: true,
                generatorSettings: entry.settings,
                owners: { connect: [{ id: staff.id }, { id: owner.id }] },
                moderators: { connect: [{ id: mod.id }] },
                usersFavorited: { connect: [{ id: player.id }] },
            },
        });
        await prisma.category.createMany({
            data: categories.map((name) => ({ gameId: game.id, name })),
        });
        await Promise.all(
            entry.goals.map((goal, i) =>
                prisma.goal.create({
                    data: {
                        ...goal,
                        gameId: game.id,
                        categories: {
                            connect: {
                                gameId_name: {
                                    gameId: game.id,
                                    name: categories[i % categories.length],
                                },
                            },
                        },
                    },
                }),
            ),
        );
    }

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
    const tagNames = [
        'Easy',
        'Medium',
        'Hard',
        'Extreme',
        'Optional',
        'Main Story',
        'Side Quest',
        'Timed',
        'Legendary Equipment',
    ];

    const epicGame = await prisma.game.create({
        data: {
            name: 'Epic Bingo Adventure',
            descriptionMd:
                'Travel from the village to distant kingdoms, collecting relics, solving puzzles and challenging legendary foes.',
            slug: 'epic',
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
            newGeneratorBeta: true,
            generatorSettings: {
                goalFilters: [],
                goalTransformation: [],
                boardLayout: {
                    mode: 'srlv5',
                },
                restrictions: [{ type: 'line-type-exclusion' }],
                adjustments: [],
            },
        },
    });

    const tags = await prisma.goalTag.createManyAndReturn({
        data: tagNames.map((name) => ({
            name,
            gameId: epicGame.id,
        })),
    });
    const regions = [
        'Whispering Woods',
        'Amber Coast',
        'Frostfall Peaks',
        'Sunken Marsh',
        'Crystal Vale',
        'Ember Highlands',
        'Moonlit Grove',
        'Shattered Isles',
        'Silver Desert',
        'Stormwatch Cliffs',
        'Verdant Basin',
        'Hollow Mountain',
        'Golden Steppe',
        'Ashen Frontier',
        'Starfall Canyon',
        'Winterglass Tundra',
        'Coral Reach',
        'Twilight Fen',
        'Obsidian Ridge',
        'Dawnspire Kingdom',
    ];
    const adventureQuests = [
        {
            goal: 'Gather Rare Herbs',
            description: 'Collect five medicinal herbs for the village healer.',
            categories: ['Collecting', 'Resource Management'],
        },
        {
            goal: 'Defeat the Bandit Captain',
            description:
                'Track down the captain and recover the stolen supplies.',
            categories: ['Combat'],
        },
        {
            goal: 'Restore the Ancient Shrine',
            description:
                'Solve the shrine puzzle and rekindle its sacred flame.',
            categories: ['Puzzle', 'Story Progression'],
        },
        {
            goal: 'Discover a Hidden Campsite',
            description: 'Find the abandoned campsite and mark it on your map.',
            categories: ['Exploration'],
        },
        {
            goal: 'Deliver Supplies to the Outpost',
            description: 'Bring four supply crates to the isolated outpost.',
            categories: ['Resource Management'],
        },
        {
            goal: 'Rescue the Missing Scout',
            description:
                'Follow the scout’s trail and escort them safely home.',
            categories: ['Stealth', 'Exploration'],
        },
        {
            goal: 'Win the Arena Challenge',
            description:
                'Survive three consecutive rounds against the local champions.',
            categories: ['Combat', 'Time Challenge'],
        },
        {
            goal: 'Reach the Highest Lookout',
            description:
                'Climb to the lookout without using a fast-travel point.',
            categories: ['Movement'],
        },
        {
            goal: 'Disarm the Ruins’ Traps',
            description:
                'Find and disable five traps without triggering an alarm.',
            categories: ['Puzzle', 'Stealth'],
        },
        {
            goal: 'Recover the Guardian’s Relic',
            description: 'Defeat the guardian and retrieve its ancient relic.',
            categories: ['Boss Battle', 'Collecting'],
        },
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
            tags: {
                connect: [{ id: tags[0].id }, { id: tags[5].id }],
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
            tags: {
                connect: [{ id: tags[2].id }, { id: tags[5].id }],
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
            tags: {
                connect: [{ id: tags[1].id }, { id: tags[6].id }],
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
            tags: {
                connect: [{ id: tags[3].id }, { id: tags[5].id }],
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
            tags: {
                connect: [{ id: tags[0].id }, { id: tags[7].id }],
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
            tags: {
                connect: [{ id: tags[3].id }, { id: tags[7].id }],
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
            tags: {
                connect: [{ id: tags[1].id }, { id: tags[6].id }],
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
            tags: {
                connect: [{ id: tags[0].id }, { id: tags[5].id }],
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
            tags: {
                connect: [{ id: tags[0].id }, { id: tags[5].id }],
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
            tags: {
                connect: [{ id: tags[2].id }, { id: tags[7].id }],
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
            tags: {
                connect: [{ id: tags[2].id }, { id: tags[7].id }],
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
            tags: {
                connect: [{ id: tags[2].id }, { id: tags[7].id }],
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
            tags: {
                connect: [{ id: tags[3].id }, { id: tags[5].id }],
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
            tags: {
                connect: [{ id: tags[1].id }, { id: tags[6].id }],
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
            tags: {
                connect: [{ id: tags[0].id }, { id: tags[7].id }],
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
            tags: {
                connect: [{ id: tags[3].id }, { id: tags[7].id }],
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
            tags: {
                connect: [{ id: tags[1].id }, { id: tags[6].id }],
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
            tags: {
                connect: [{ id: tags[0].id }, { id: tags[5].id }],
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
            tags: {
                connect: [{ id: tags[2].id }, { id: tags[6].id }],
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
            tags: {
                connect: [{ id: tags[3].id }, { id: tags[5].id }],
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
            tags: {
                connect: [{ id: tags[2].id }, { id: tags[8].id }],
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
            tags: {
                connect: [{ id: tags[3].id }, { id: tags[7].id }],
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
            tags: {
                connect: [{ id: tags[1].id }, { id: tags[6].id }],
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
            tags: {
                connect: [{ id: tags[4].id }, { id: tags[5].id }],
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
            tags: {
                connect: [{ id: tags[0].id }, { id: tags[7].id }],
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
            tags: {
                connect: [{ id: tags[3].id }, { id: tags[7].id }],
            },
            difficulty: 24,
        },
        ...[
            {
                goal: 'Talk to the Village Elder',
                description:
                    'Visit the elder to learn about the troubles facing the village.',
                difficulty: 1,
            },
            {
                goal: 'Light the Campfire',
                description:
                    'Gather kindling and light the campfire outside the village.',
                difficulty: 2,
            },
        ].map((goal) => ({
            ...goal,
            gameId: id,
            categories: {
                connect: {
                    gameId_name: { gameId: id, name: 'Story Progression' },
                },
            },
            tags: { connect: [{ id: tags[0].id }, { id: tags[5].id }] },
        })),
        ...regions.flatMap((region, regionIndex) =>
            adventureQuests.map((quest, questIndex) => {
                const difficulty =
                    26 + regionIndex * adventureQuests.length + questIndex;
                return {
                    gameId: id,
                    goal: `${quest.goal} in ${region}`,
                    description: `${quest.description} Travel to ${region} and return to the local guild with news of your success.`,
                    categories: {
                        connect: quest.categories.map((name) => ({
                            gameId_name: { gameId: id, name },
                        })),
                    },
                    tags: {
                        connect: [
                            {
                                id: tags[
                                    Math.min(
                                        3,
                                        Math.floor((difficulty - 1) / 60),
                                    )
                                ].id,
                            },
                            { id: tags[6].id },
                        ],
                    },
                    difficulty,
                };
            }),
        ),
    ];

    await prisma.category.createMany({
        data: realisticCategories.map((cat) => ({
            gameId: epicGame.id,
            name: cat,
        })),
    });
    await Promise.all(
        realisticGoals(epicGame.id).map((g) => prisma.goal.create({ data: g })),
    );
    const variants = [
        {
            name: 'Open World',
            description: 'Choose freely from every adventure in the kingdom.',
            settings: generatorSettings(),
        },
        {
            name: 'First Steps',
            description:
                'Meet the village elder, light the campfire and collect your first coins.',
            settings: generatorSettings(undefined, [
                { mode: 'difficulty', max: 3 },
            ]),
        },
        {
            name: 'Prologue',
            description:
                'Begin your journey with a few approachable village adventures.',
            settings: generatorSettings(undefined, [
                { mode: 'difficulty', max: 4 },
            ]),
        },
        {
            name: 'Village Errands',
            description:
                'A shorter adventure focused on the village and nearby lands.',
            settings: generatorSettings(undefined, [
                { mode: 'difficulty', max: 20 },
            ]),
        },
        {
            name: 'Lost Relics',
            description: 'Adventure without the aid of legendary equipment.',
            settings: generatorSettings({ mode: 'srlv5' }, [
                { mode: 'tags-exclusion', tags: [tags[8].id] },
            ]),
        },
        {
            name: 'Weekend Expedition',
            description:
                'Nine adventures chosen for a short trip into the wilds.',
            settings: generatorSettings(expeditionLayout(3)),
        },
        {
            name: 'River Expedition',
            description:
                'Follow the river through a long, winding series of adventures.',
            settings: generatorSettings(expeditionLayout(9, 4)),
        },
        {
            name: 'World Tour',
            description:
                'A grand expedition of 225 adventures from across the kingdom.',
            settings: generatorSettings(expeditionLayout(15)),
        },
        {
            name: 'Guild Contracts',
            description:
                'Complete a balanced set of 36 contracts offered by the adventurers’ guild.',
            settings: generatorSettings({
                mode: 'difficulty-distribution',
                distribution: Array.from({ length: 36 }, (_, i) => ({
                    difficulty: i + 1,
                    count: 1,
                })),
            }),
        },
    ];
    for (const variant of variants) {
        await prisma.variant.create({
            data: {
                gameId: epicGame.id,
                name: variant.name,
                description: variant.description,
                generatorSettings: variant.settings,
            },
        });
    }
    console.log(
        'Created six games, including Epic Bingo Adventure and its nine variants.',
    );
}

if (require.main === module) {
    const prisma = new PrismaClient();
    main(prisma)
        .then(async () => {
            await prisma.$disconnect();
        })
        .catch(async (e) => {
            console.error(e);
            await prisma.$disconnect();
            process.exit(1);
        });
}
