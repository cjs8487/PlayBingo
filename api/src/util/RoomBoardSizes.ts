import { BoardSizeOptions, GeneratorSettings } from '@playbingo/shared';
import {
    availableBoardSizes,
    availableCustomBoardSize,
    difficultyVariantSizes,
} from '../core/generation/BoardSizes';
import { gameForSlug, getDifficultyVariant } from '../database/games/Games';
import { goalFilterMetadataForGame } from '../database/games/Goals';
import { getVariant } from '../database/games/Variants';

export const roomBoardSizes = async (
    slug: string,
    variantId?: string,
): Promise<BoardSizeOptions> => {
    const game = await gameForSlug(slug);
    if (!game) throw new Error('Game not found');
    const goals = await goalFilterMetadataForGame(slug);
    let settings: GeneratorSettings = game.generatorSettings;
    if (variantId) {
        const difficulty = await getDifficultyVariant(variantId);
        if (difficulty) {
            if (difficulty.gameId !== game.id)
                throw new Error('Invalid variant selected');
            return {
                sizes: difficultyVariantSizes(
                    goals.length,
                    difficulty.goalAmounts,
                ),
            };
        }
        const variant = await getVariant(variantId);
        if (!game.newGeneratorBeta || !variant || variant.gameId !== game.id)
            throw new Error('Invalid variant selected');
        settings = variant.generatorSettings;
    }
    if (!game.newGeneratorBeta) return { sizes: goals.length >= 25 ? [5] : [] };
    if (settings.boardLayout.mode === 'custom') {
        const customLayout = availableCustomBoardSize(goals, settings);
        return { sizes: [], ...(customLayout ? { customLayout } : {}) };
    }
    return { sizes: availableBoardSizes(goals, settings) };
};
