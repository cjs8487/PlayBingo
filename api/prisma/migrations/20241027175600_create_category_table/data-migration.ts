import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.$transaction(
        async (tx) => {
            const games = await tx.game.findMany({ include: { goals: true } });
            await Promise.all(
                games.map(async (game) => {
                    const categories = game.goals.reduce<string[]>(
                        (prev, goal) => {
                            goal.oldCategories.forEach((cat) => {
                                if (!prev.includes(cat)) {
                                    prev.push(cat);
                                }
                            });
                            return prev;
                        },
                        [],
                    );

                    await Promise.all(
                        categories.map(async (cat) => {
                            await tx.category.create({
                                data: {
                                    game: { connect: { id: game.id } },
                                    name: cat,
                                },
                            });
                        }),
                    );

                    await Promise.all(
                        game.goals.map(async (goal) => {
                            await tx.goal.update({
                                data: {
                                    categories: {
                                        connect: goal.oldCategories.map(
                                            (cat) => ({
                                                gameId_name: {
                                                    gameId: game.id,
                                                    name: cat,
                                                },
                                            }),
                                        ),
                                    },
                                },
                                where: { id: goal.id },
                            });
                        }),
                    );
                }),
            );
        },
        { timeout: 60 * 1000 },
    );
    const goals = await prisma.goal.findMany({ include: { categories: true } });
    goals.forEach((goal) => {
        console.log(
            `${goal.goal}: [${goal.categories.map((c) => c.name).join()}]`,
        );
    });
}

main()
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
