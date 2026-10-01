import { Category } from '@prisma/client';
import { mock } from 'jest-mock-extended';

export const mockCategory = mock<Category & { game: { slug: string } }>();
mockCategory.id = 'c1';
mockCategory.name = 'Cat 1';
mockCategory.game = { slug: 'test-game' };

export const getCategories = jest.fn(async (slug: string) => []);
export const createCategory = jest.fn(
    async (name: string, gameSlug: string, max?: number) => ({
        ...mockCategory,
        name,
        game: { slug: gameSlug },
        max,
    }),
);
export const getCategory = jest.fn(async (id: string) => {
    if (id === 'non-existent' || id === 'unknown' || id === '10') return null;
    return mockCategory;
});
export const updateCategory = jest.fn(
    async (id: string, data: { name?: string; max?: number }) => ({
        ...mockCategory,
        id,
        ...data,
    }),
);
export const deleteCategory = jest.fn(async (id: string) => ({
    ...mockCategory,
    id,
}));
