-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "exploration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "explorationStart" TEXT;
