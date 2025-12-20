-- CreateEnum
CREATE TYPE "RaceHandler" AS ENUM ('LOCAL', 'RACETIME');

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "finishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "raceHandler" "RaceHandler",
ADD COLUMN     "startedAt" TIMESTAMP(3);
