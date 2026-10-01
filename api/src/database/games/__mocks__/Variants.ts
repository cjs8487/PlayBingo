import { Variant } from '@prisma/client';
import { mock } from 'jest-mock-extended';

export const mockVariant = mock<Variant>();
mockVariant.id = 'v1';
mockVariant.gameId = '1';
mockVariant.name = 'Var 1';
mockVariant.generatorSettings = { generator: 'random' } as any;

export const createVariant = jest.fn(
    async (
        slug: string,
        name: string,
        generatorSettings: Variant['generatorSettings'],
        description?: string,
    ) => ({
        ...mockVariant,
        name,
        generatorSettings,
        description: description ?? '',
    }),
);
export const updateVariant = jest.fn(
    async (
        id: string,
        data: {
            name?: string;
            description?: string;
            generatorSettings?: Variant['generatorSettings'];
        },
    ) => ({
        ...mockVariant,
        id,
        ...data,
    }),
);
export const deleteVariant = jest.fn(async (id: string) => ({
    ...mockVariant,
    id,
}));
export const getVariant = jest.fn(async (id: string) => {
    if (!id || id === 'missing-var-id' || id === 'unknown') return null;
    return mockVariant;
});
