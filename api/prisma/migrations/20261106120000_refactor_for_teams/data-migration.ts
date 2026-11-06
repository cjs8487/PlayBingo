import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.$transaction(
        async (tx) => {
            // Player.spectator is deprecated but retained for this migration.
            // Player.color is also retained in the database but is no longer used.
            const players = await tx.player.findMany({
                select: {
                    id: true,
                    spectator: true,
                    roomId: true,
                    nickname: true,
                },
            });

            for (const player of players) {
                if (!player.spectator) {
                    const team = await tx.team.create({
                        data: {
                            name: player.nickname,
                            key: player.id,
                            roomId: player.roomId,
                        },
                    });

                    await tx.player.update({
                        where: { id: player.id },
                        data: { teamId: team.id },
                    });
                }
            }
        },
        { timeout: 300000 },
    );
}

main()
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
