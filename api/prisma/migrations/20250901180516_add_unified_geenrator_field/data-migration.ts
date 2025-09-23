import {
    GenerationGlobalAdjustments,
    GenerationGoalRestriction,
    GenerationGoalSelection,
    PrismaClient,
} from '@prisma/client';
import { GeneratorConfig } from '@playbingo/shared/GeneratorConfig';

const prisma = new PrismaClient();

async function main() {
    await prisma.$transaction(
        async (tx) => {
            const games = await tx.game.findMany({});
            await Promise.all(
                games.map(async (game) => {
                    const generatorConfig: GeneratorConfig = {
                        goalFilters: [],
                        goalTransformation: 'none',
                        boardLayout: 'random',
                        goalSelection: 'random',
                        restrictions: [],
                        adjustments: [],
                    };

                    switch (game.generationBoardLayout) {
                        case 'SRLv5':
                            generatorConfig.boardLayout = 'srlv5';
                            break;
                        case 'ISAAC':
                            generatorConfig.boardLayout = 'isaac';
                            break;
                    }

                    if (
                        game.generationGoalSelection ===
                        GenerationGoalSelection.DIFFICULTY
                    ) {
                        generatorConfig.goalSelection = 'difficulty';
                    }

                    if (
                        game.generationGoalRestrictions.includes(
                            GenerationGoalRestriction.LINE_TYPE_EXCLUSION,
                        )
                    ) {
                        generatorConfig.restrictions.push({
                            type: 'line-type-exclusion',
                        });
                    }

                    if (
                        game.generationGlobalAdjustments.includes(
                            GenerationGlobalAdjustments.SYNERGIZE,
                        )
                    ) {
                        generatorConfig.adjustments.push({ type: 'synergize' });
                    }
                    if (
                        game.generationGlobalAdjustments.includes(
                            GenerationGlobalAdjustments.BOARD_TYPE_MAX,
                        )
                    ) {
                        generatorConfig.adjustments.push({
                            type: 'board-type-max',
                        });
                    }

                    await tx.game.update({
                        data: {
                            generatorConfig,
                        },
                        where: { id: game.id },
                    });
                }),
            );
        },
        { timeout: 60 * 1000 },
    );
}

main()
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
