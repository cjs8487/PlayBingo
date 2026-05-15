import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.$transaction(
        async (tx) => {
            // We use raw SQL because the 'spectator' column might have been dropped or 
            // is not available in the current Prisma Client generation.
            // We also need to fetch the roomId to create the team in the correct room.
            const players: any[] = await tx.$queryRawUnsafe(
                'SELECT id, spectator, "roomId", nickname FROM "Player"'
            );

            for (const player of players) {
                // If the player was not a spectator, they need a team.
                if (player.spectator === false) {
                    // Create a new team for this player.
                    // The 'key' is required in the Team model. We'll use a simple approach for it.
                    const team = await tx.team.create({
                        data: {
                            name: `${player.nickname}'s Team`,
                            key: player.id, // Using player id as a key for uniqueness if needed
                            roomId: player.roomId,
                        },
                    });

                    // Assign the player to the newly created team.
                    await tx.player.update({
                        where: { id: player.id },
                        data: {
                            teamId: team.id,
                        },
                    });
                } else {
                    // If the player was a spectator, teamId should remain null.
                    // This is already the default for the new column, but we ensure it.
                    await tx.player.update({
                        where: { id: player.id },
                        data: {
                            teamId: null,
                        },
                    });
                }
            }
        },
        { timeout: 300000 } // 5 minutes timeout for potentially large data
    );
}

main()
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
