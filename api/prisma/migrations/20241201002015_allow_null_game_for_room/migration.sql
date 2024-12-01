-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_gameId_fkey";

-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "gameId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
