import {
    GenerationGlobalAdjustments,
    GenerationGoalRestriction,
    GenerationGoalSelection,
    PrismaClient,
} from '@prisma/client';
import { GeneratorSettings } from '@playbingo/shared';

const prisma = new PrismaClient();

async function main() {
    await prisma.$transaction(
        async (tx) => {
            const games = await tx.game.findMany({});
            await Promise.all(
                games.map(async (game) => {
                    const generatorSettings: GeneratorSettings = {
                        goalFilters: [],
                        goalTransformation: 'none',
                        boardLayout: 'random',
                        goalSelection: 'random',
                        restrictions: [],
                        adjustments: [],
                    };

                    switch (game.generationBoardLayout) {
                        case 'SRLv5':
                            generatorSettings.boardLayout = 'srlv5';
                            break;
                        case 'ISAAC':
                            generatorSettings.boardLayout = 'isaac';
                            break;
                    }

                    if (
                        game.generationGoalSelection ===
                        GenerationGoalSelection.DIFFICULTY
                    ) {
                        generatorSettings.goalSelection = 'difficulty';
                    }

                    if (
                        game.generationGoalRestrictions.includes(
                            GenerationGoalRestriction.LINE_TYPE_EXCLUSION,
                        )
                    ) {
                        generatorSettings.restrictions.push({
                            type: 'line-type-exclusion',
                        });
                    }

                    if (
                        game.generationGlobalAdjustments.includes(
                            GenerationGlobalAdjustments.SYNERGIZE,
                        )
                    ) {
                        generatorSettings.adjustments.push({
                            type: 'synergize',
                        });
                    }
                    if (
                        game.generationGlobalAdjustments.includes(
                            GenerationGlobalAdjustments.BOARD_TYPE_MAX,
                        )
                    ) {
                        generatorSettings.adjustments.push({
                            type: 'board-type-max',
                        });
                    }

                    await tx.game.update({
                        data: {
                            generatorSettings,
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
