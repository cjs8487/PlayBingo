import { Prisma } from '@prisma/client';
import { prisma } from '../../../src/database/Database';

async function backfillRoomBoardDimensions(tx: Prisma.TransactionClient) {
    const rooms = await tx.room.findMany({
        include: { game: true, variant: true },
    });
    await Promise.all(
        rooms.map(async (room) => {
            const generatorSettings =
                room.variant?.generatorSettings ?? room.game?.generatorSettings;
            if (generatorSettings?.boardLayout.mode === 'custom') {
                await tx.room.update({
                    where: { id: room.id },
                    data: {
                        boardWidth:
                            generatorSettings.boardLayout.layout[0].length,
                        boardHeight:
                            generatorSettings.boardLayout.layout.length,
                    },
                });
            } else {
                await tx.room.update({
                    where: { id: room.id },
                    data: {
                        boardWidth: 5,
                        boardHeight: 5,
                    },
                });
            }
        }),
    );
}

if (require.main === module) {
    prisma
        .$transaction(backfillRoomBoardDimensions)
        .catch(async (e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => await prisma.$disconnect());
}
