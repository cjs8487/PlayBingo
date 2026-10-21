import { goalTransferData } from '@playbingo/shared';
import { goalCreateData } from '../database/games/Goals';

describe('goal import/export', () => {
    const goal = {
        id: 'original-goal',
        gameId: 'original-game',
        game: { id: 'original-game' },
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
        oldCategories: ['obsolete'],
        goalImageId: 'image',
        secondaryGoalImageId: 'secondary-image',
        goalImageTagId: 'image-tag',
        goal: 'Collect items',
        description: null,
        difficulty: null,
        count: 0,
        meta: { tracker: 'items' },
        categories: ['Items'],
        tags: [{ name: 'Collection' }],
        image: { id: 'image' },
        secondaryImage: { id: 'secondary-image' },
        imageTag: { id: 'image-tag' },
    };

    it('exports additional fields by default without mutating the original', () => {
        const exported = goalTransferData({ ...goal, futureProperty: false });
        expect(exported).toEqual({
            goal: goal.goal,
            count: 0,
            meta: goal.meta,
            categories: goal.categories,
            tags: ['Collection'],
            image: goal.image,
            secondaryImage: goal.secondaryImage,
            imageTag: goal.imageTag,
            futureProperty: false,
        });
        expect(goal.id).toBe('original-goal');
    });

    it('transfers categories and tags by name without database fields', () => {
        const input = {
            goal: 'Win',
            categories: [
                { id: 'category-id', gameId: 'source', name: 'Items', max: 2 },
            ],
            tags: [{ id: 'tag-id', name: 'Collection' }],
        };
        const exported = goalTransferData(input);
        expect(exported).toEqual({
            goal: 'Win',
            categories: ['Items'],
            tags: ['Collection'],
        });
        expect(goalTransferData(exported)).toEqual(exported);
        expect(input.categories[0].id).toBe('category-id');
        expect(goalCreateData(exported, 'destination')).toEqual(
            goalCreateData(input, 'destination'),
        );
    });

    it('round-trips goal data and binds relations to the destination game', () => {
        const exported = JSON.parse(JSON.stringify(goalTransferData(goal)));
        const data = goalCreateData(exported, 'destination');
        expect(data).toMatchObject({
            goal: goal.goal,
            count: 0,
            meta: goal.meta,
            game: { connect: { id: 'destination' } },
            categories: {
                connectOrCreate: [
                    {
                        create: {
                            name: 'Items',
                            game: { connect: { id: 'destination' } },
                        },
                        where: {
                            gameId_name: {
                                gameId: 'destination',
                                name: 'Items',
                            },
                        },
                    },
                ],
            },
            tags: {
                connectOrCreate: [
                    {
                        where: {
                            gameId_name: {
                                gameId: 'destination',
                                name: 'Collection',
                            },
                        },
                    },
                ],
            },
            image: { connect: { id: 'image', gameId: 'destination' } },
            secondaryImage: {
                connect: { id: 'secondary-image', gameId: 'destination' },
            },
            imageTag: { connect: { id: 'image-tag', gameId: 'destination' } },
        });
    });

    it('ignores imported internal fields and supports minimal goals', () => {
        const data = goalCreateData(goal, 'destination');
        for (const key of [
            'id',
            'gameId',
            'createdAt',
            'updatedAt',
            'oldCategories',
            'goalImageId',
            'secondaryGoalImageId',
            'goalImageTagId',
        ]) {
            expect(data).not.toHaveProperty(key);
        }
        expect(data.game).toEqual({ connect: { id: 'destination' } });
        expect(
            goalCreateData({ goal: 'Win', meta: null }, 'destination'),
        ).toMatchObject({
            goal: 'Win',
            game: { connect: { id: 'destination' } },
        });
    });

    it('omits null and undefined fields while preserving meaningful falsy values and metadata', () => {
        expect(
            goalTransferData({
                goal: 'Win',
                description: null,
                difficulty: undefined,
                count: 0,
                enabled: false,
                text: '',
                categories: [],
                meta: { target: null },
            }),
        ).toEqual({
            goal: 'Win',
            count: 0,
            enabled: false,
            text: '',
            categories: [],
            meta: { target: null },
        });
    });

    it('imports omitted, undefined, and null optional values identically', () => {
        const emptyFields = {
            description: null,
            difficulty: null,
            count: null,
            meta: null,
            categories: null,
            tags: null,
            image: null,
            secondaryImage: null,
            imageTag: null,
        };
        const minimal = goalCreateData({ goal: 'Win' }, 'destination');
        expect(
            goalCreateData({ goal: 'Win', ...emptyFields }, 'destination'),
        ).toEqual(minimal);
        const undefinedFields = Object.fromEntries(
            Object.keys(emptyFields).map((key) => [key, undefined]),
        );
        expect(
            goalCreateData({ goal: 'Win', ...undefinedFields }, 'destination'),
        ).toEqual(minimal);
    });
});
