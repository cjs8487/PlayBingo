import { DifficultyVariant, Game, GoalTag, User } from '@prisma/client';
import { mock } from 'jest-mock-extended';

export const mockOwnerUser = mock<User>();
mockOwnerUser.id = 'u1';
mockOwnerUser.username = 'test-user-owner';

export const mockModUser = mock<User>();
mockModUser.id = 'u2';
mockModUser.username = 'test-user-mod';

export const mockDifficultyVariant = mock<DifficultyVariant>();
mockDifficultyVariant.id = 'v1';
mockDifficultyVariant.gameId = '1';
mockDifficultyVariant.name = 'Var 1';
mockDifficultyVariant.goalAmounts = [25];

export const mockGoalTag = mock<GoalTag & { _count: { goals: number } }>();
mockGoalTag.id = 't1';
mockGoalTag.name = 'Tag 1';
mockGoalTag._count = { goals: 0 };

export const mockGame = mock<
    Game & {
        owners: User[];
        moderators: User[];
        difficultyVariants: DifficultyVariant[];
        variants: any[];
        resources: any[];
    }
>();
mockGame.id = '1';
mockGame.slug = 'test-game';
mockGame.name = 'Test Game';
mockGame.coverImage = 'cover.png';
mockGame.enableSRLv5 = true;
mockGame.racetimeBeta = false;
mockGame.racetimeCategory = 'test-cat';
mockGame.racetimeGoal = 'test-goal';
mockGame.slugWords = ['test'];
mockGame.newGeneratorBeta = true;
mockGame.generatorSettings = { generator: 'random' } as any;
mockGame.owners = [mockOwnerUser];
mockGame.moderators = [mockModUser];
mockGame.variants = [];
mockGame.resources = [];

const updatedGame = (slug: string, data: Record<string, unknown>) => ({
    slug,
    ...data,
});

export const allGames = jest.fn(async (user?: string) => [mockGame]);

export const gameForSlug = jest.fn(async (slug: string) => {
    if (
        !slug ||
        slug === 'invalid' ||
        slug === 'unknown-slug' ||
        slug === 'non-existent' ||
        slug === 'missing-slug' ||
        slug === 'unknown'
    ) {
        return null;
    }
    return mockGame;
});

export const createGame = jest.fn(
    async (name: string, slug: string, coverImage?: string) =>
        updatedGame(slug, { name, coverImage }),
);
export const deleteGame = jest.fn(async (slug: string) =>
    updatedGame(slug, {}),
);
export const goalCount = jest.fn(async (slug: string) => 10);

export const updateGameName = jest.fn(async (slug: string, name: string) =>
    updatedGame(slug, { name }),
);
export const updateGameCover = jest.fn(
    async (slug: string, coverImage: string | null) =>
        updatedGame(slug, { coverImage }),
);
export const updateSRLv5Enabled = jest.fn(
    async (slug: string, enableSRLv5: boolean) =>
        updatedGame(slug, { enableSRLv5 }),
);
export const updateDifficultyVariantsEnabled = jest.fn(
    async (slug: string, difficultyVariantsEnabled: boolean) =>
        updatedGame(slug, { difficultyVariantsEnabled }),
);
export const updateDifficultyGroups = jest.fn(
    async (slug: string, difficultyGroups: number) =>
        updatedGame(slug, { difficultyGroups }),
);
export const updateUseTypedRandom = jest.fn(
    async (slug: string, useTypedRandom: boolean) =>
        updatedGame(slug, { useTypedRandom }),
);
export const updateRacetimeCategory = jest.fn(
    async (slug: string, racetimeCategory: string) =>
        updatedGame(slug, { racetimeCategory }),
);
export const updateRacetimeGoal = jest.fn(
    async (slug: string, racetimeGoal: string) =>
        updatedGame(slug, { racetimeGoal }),
);
export const updateSlugWords = jest.fn(
    async (slug: string, slugWords: string[]) =>
        updatedGame(slug, { slugWords }),
);
export const updateDescription = jest.fn(
    async (slug: string, descriptionMd: string) =>
        updatedGame(slug, { descriptionMd }),
);
export const updateSetup = jest.fn(async (slug: string, setupMd: string) =>
    updatedGame(slug, { setupMd }),
);
export const updateLinks = jest.fn(async (slug: string, links: any[]) => ({
    ...updatedGame(slug, {}),
    resources: links,
}));
export const getRacetimeConfiguration = jest.fn(async (slug: string) => ({
    racetimeCategory: 'test-cat',
    racetimeGoal: 'test-goal',
}));

export const addOwners = jest.fn(async (slug: string, users: string[]) => ({
    ...updatedGame(slug, {}),
    owners: users.map((id) => ({ id })),
}));
export const addModerators = jest.fn(async (slug: string, users: string[]) => ({
    ...updatedGame(slug, {}),
    moderators: users.map((id) => ({ id })),
}));
export const removeOwner = jest.fn(async (slug: string, user: string) => ({
    ...updatedGame(slug, {}),
    owners: mockGame.owners.filter(({ id }) => id !== user),
}));
export const removeModerator = jest.fn(async (slug: string, user: string) => ({
    ...updatedGame(slug, {}),
    moderators: mockGame.moderators.filter(({ id }) => id !== user),
}));

export const isOwner = jest.fn(async (slug: string, user: string) => {
    return (
        user === 'test-user-owner' ||
        user === 'test-user-staff' ||
        user === 'owner'
    );
});

export const isModerator = jest.fn(async (slug: string, user: string) => {
    return (
        user === 'test-user-mod' ||
        user === 'test-user-owner' ||
        user === 'test-user-staff' ||
        user === 'mod' ||
        user === 'owner'
    );
});

export const favoriteGame = jest.fn(async (slug: string, user: string) => true);
export const unfavoriteGame = jest.fn(
    async (slug: string, user: string) => true,
);

export const createDifficultyVariant = jest.fn(
    async (slug: string, name: string, amounts: number[]) => ({
        ...mockDifficultyVariant,
        name,
        goalAmounts: amounts,
    }),
);
export const updateDifficultyVariant = jest.fn(
    async (id: string, name: string, amounts: number[]) => ({
        ...mockDifficultyVariant,
        id,
        name,
        goalAmounts: amounts,
    }),
);
export const deleteDifficultyVariant = jest.fn(async (id: string) => ({
    ...mockDifficultyVariant,
    id,
}));
export const getDifficultyVariant = jest.fn(async (id: string) => {
    if (id === 'non-existent' || id === 'fake-id' || id === 'missing-var-id')
        return null;
    return mockDifficultyVariant;
});
export const getDifficultyGroupCount = jest.fn(async (slug: string) => 1);
export const useTypedRandom = jest.fn(async (slug: string) => false);

export const slugForMedia = jest.fn(async (id: string) => {
    if (id === 'fake-id.png' || id === 'null-slug') return null;
    return 'test-game';
});
export const getGameCover = jest.fn(async (slug: string) => 'cover.png');
export const updateGeneratorSettings = jest.fn(
    async (slug: string, generatorSettings: any) =>
        updatedGame(slug, { generatorSettings }),
);

export const getTags = jest.fn(async (slug: string) => [mockGoalTag]);
export const createTag = jest.fn(async (slug: string, name: string) => ({
    ...mockGoalTag,
    name,
}));
export const updateTag = jest.fn(async (id: string, name: string) => ({
    ...mockGoalTag,
    id,
    name,
}));
export const tagBelongsToGame = jest.fn(
    async (tagId: string, slug: string) => tagId !== 'invalid-tag',
);
export const deleteTag = jest.fn(async (id: string) => ({
    ...mockGoalTag,
    id,
}));
