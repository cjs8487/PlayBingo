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
                    const links = Array.from(
                        game.linksMd?.matchAll(
                            /^\[(?<text>.+)\]\((?<url>.+)\)(?: - (?<description>.+$))?/gm,
                        ) ?? [],
                    ).map((match) => ({
                        text: match.groups?.text,
                        url: match.groups?.url,
                        description: match.groups?.description,
                    }));

                    await Promise.all(
                        links.map(async (link) => {
                            if (!link.url || !link.text) {
                                return;
                            }

                            return tx.gameResource.create({
                                data: {
                                    gameId: game.id,
                                    name: link.text,
                                    url: link.url,
                                    description: link.description,
                                },
                            });
                        }),
                    );
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
