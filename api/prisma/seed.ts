import { pbkdf2Sync, randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

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
    await prisma.game.deleteMany();
    await prisma.goal.deleteMany();
    const categories = [
        'Category 1',
        'Category 2',
        'Category 3',
        'Category 4',
        'Category 5',
    ];

    const goals = Array.from({ length: 25 }).map((_, i) => ({
        goal: `Goal ${i + 1}`,
        description: `Description for Goal ${i + 1}`,
        categories: [categories[i % categories.length]],
    }));

    const game1 = await prisma.game.create({
        data: {
            name: '25 Goals and No Difficulties',
            slug: 'nodiff',
            enableSRLv5: false,
            racetimeBeta: false,
            owners: { connect: [{ id: staff.id }, { id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
            goals: { create: goals },
            usersFavorited: {
                connect: [
                    { id: staff.id },
                    { id: owner.id },
                    { id: player.id },
                ],
            },
        },
    });

    const game2 = await prisma.game.create({
        data: {
            name: 'SRLv5 25 Goals',
            slug: 'srl25',
            enableSRLv5: true,
            racetimeBeta: false,
            owners: { connect: [{ id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
            goals: {
                create: Array.from({ length: 25 }).map((_, i) => ({
                    goal: `Goal ${i + 1}`,
                    description: `Description for Goal ${i + 1}`,
                    categories: [categories[i % categories.length]],
                    difficulty: (i % 25) + 1,
                })),
            },
        },
    });

    const game3 = await prisma.game.create({
        data: {
            name: 'SRLv5 50',
            slug: 'srl50',
            enableSRLv5: false,
            racetimeBeta: false,
            owners: { connect: [{ id: staff.id }, { id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
            goals: {
                create: Array.from({ length: 50 }).map((_, i) => ({
                    goal: `Goal ${i + 1}`,
                    description: `Description for Goal ${i + 1}`,
                    categories: [categories[i % categories.length]],
                    difficulty: (i % 25) + 1,
                })),
            },
            usersFavorited: { connect: [{ id: owner.id }, { id: mod.id }] },
        },
    });

    const game4 = await prisma.game.create({
        data: {
            name: 'SRLv5 100',
            slug: 'srl100',
            enableSRLv5: true,
            racetimeBeta: false,
            owners: { connect: [{ id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
            goals: {
                create: Array.from({ length: 100 }).map((_, i) => ({
                    goal: `Goal ${i + 1}`,
                    description: `Description for Goal ${i + 1}`,
                    categories: [categories[i % categories.length]],
                    difficulty: (i % 25) + 1,
                })),
            },
        },
    });

    const game5 = await prisma.game.create({
        data: {
            name: 'SRLv5 250',
            slug: 'srl250',
            enableSRLv5: true,
            racetimeBeta: false,
            owners: { connect: [{ id: owner.id }] },
            moderators: { connect: [{ id: mod.id }] },
            goals: {
                create: Array.from({ length: 250 }).map((_, i) => ({
                    goal: `Goal ${i + 1}`,
                    description: `Description for Goal ${i + 1}`,
                    categories: [categories[i % categories.length]],
                    difficulty: (i % 25) + 1,
                })),
            },
            usersFavorited: { connect: [{ id: mod.id }, { id: player.id }] },
        },
    });

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
    const realisticGoals = [
        {
            goal: 'Collect 100 Coins',
            description: 'Gather 100 coins from various levels.',
            categories: ['Collecting'],
            difficulty: 3,
        },
        {
            goal: 'Defeat the Fire Dragon',
            description: 'Slay the Fire Dragon in the Volcano Dungeon.',
            categories: ['Combat', 'Boss Battle'],
            difficulty: 15,
        },
        {
            goal: 'Find 3 Hidden Keys',
            description: 'Locate 3 keys hidden throughout the forest.',
            categories: ['Exploration', 'Puzzle'],
            difficulty: 8,
        },
        {
            goal: 'Solve the Ancient Temple Puzzle',
            description: 'Unlock the secret chamber in the temple.',
            categories: ['Puzzle'],
            difficulty: 10,
        },
        {
            goal: 'Craft a Health Potion',
            description: 'Use herbs and water to craft a basic health potion.',
            categories: ['Resource Management'],
            difficulty: 5,
        },
        {
            goal: 'Complete the Speedrun Trial',
            description: 'Finish the speedrun course in under 3 minutes.',
            categories: ['Time Challenge'],
            difficulty: 20,
        },
        {
            goal: 'Pickpocket a Guard',
            description: 'Steal a gold coin from a guard without being caught.',
            categories: ['Stealth'],
            difficulty: 7,
        },
        {
            goal: 'Reach Level 10',
            description: 'Gain experience and reach level 10.',
            categories: ['Story Progression'],
            difficulty: 4,
        },
        {
            goal: 'Defeat 50 Enemies',
            description: 'Eliminate 50 enemies to prove your strength.',
            categories: ['Combat'],
            difficulty: 12,
        },
        {
            goal: 'Cross the Lava Pit',
            description: 'Use platforms to cross the lava pit safely.',
            categories: ['Movement', 'Puzzle'],
            difficulty: 14,
        },
        {
            goal: 'Rescue the Lost Villager',
            description: 'Find and rescue a villager trapped in the cave.',
            categories: ['Exploration', 'Story Progression'],
            difficulty: 6,
        },
        {
            goal: 'Gather 10 Rare Herbs',
            description: 'Collect rare herbs from the mountain region.',
            categories: ['Collecting', 'Resource Management'],
            difficulty: 9,
        },
        {
            goal: 'Defeat the Ice Golem',
            description: 'Defeat the Ice Golem in the Frozen Cavern.',
            categories: ['Combat', 'Boss Battle'],
            difficulty: 18,
        },
        {
            goal: 'Escape the Dungeon Maze',
            description: 'Navigate and escape the maze in the dungeon.',
            categories: ['Puzzle', 'Exploration'],
            difficulty: 13,
        },
        {
            goal: 'Solve the Color Matching Puzzle',
            description: 'Match colors correctly to unlock the gate.',
            categories: ['Puzzle'],
            difficulty: 8,
        },
        {
            goal: 'Survive the Night in the Forest',
            description: 'Survive until morning without getting caught.',
            categories: ['Stealth', 'Time Challenge'],
            difficulty: 19,
        },
        {
            goal: 'Gather 20 Crystals',
            description: 'Mine 20 crystals from the underground cave.',
            categories: ['Collecting'],
            difficulty: 5,
        },
        {
            goal: 'Win a Duel',
            description: 'Defeat an enemy in a 1v1 duel.',
            categories: ['Combat'],
            difficulty: 17,
        },
        {
            goal: 'Repair the Broken Bridge',
            description: 'Find materials and repair the bridge.',
            categories: ['Resource Management', 'Exploration'],
            difficulty: 11,
        },
        {
            goal: 'Climb the Tower of Trials',
            description: 'Reach the top of the Tower of Trials.',
            categories: ['Movement', 'Story Progression'],
            difficulty: 21,
        },
        {
            goal: 'Find the Golden Sword',
            description: 'Retrieve the legendary Golden Sword.',
            categories: ['Exploration'],
            difficulty: 16,
        },
        {
            goal: 'Complete the Puzzle Gauntlet',
            description: 'Solve a series of puzzles back-to-back.',
            categories: ['Puzzle'],
            difficulty: 23,
        },
        {
            goal: 'Steal a Rare Artifact',
            description: 'Steal an artifact from the museum undetected.',
            categories: ['Stealth', 'Resource Management'],
            difficulty: 22,
        },
        {
            goal: 'Defeat the Dark Lord',
            description: 'Defeat the final boss and save the kingdom.',
            categories: ['Combat', 'Boss Battle'],
            difficulty: 25,
        },
        {
            goal: 'Find and Open 10 Treasure Chests',
            description: 'Locate and open 10 treasure chests.',
            categories: ['Collecting'],
            difficulty: 10,
        },
        {
            goal: 'Survive the Arena for 5 Rounds',
            description: 'Defeat all enemies across 5 rounds in the arena.',
            categories: ['Combat', 'Time Challenge'],
            difficulty: 24,
        },
        ...Array.from({ length: 54 }).map((_, i) => ({
            goal: `Side Quest ${i + 27}`,
            description: `Complete side quest number ${
                i + 27
            } for extra rewards.`,
            categories: [realisticCategories[i % realisticCategories.length]],
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
            goals: { create: realisticGoals },
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
        },
    });
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
