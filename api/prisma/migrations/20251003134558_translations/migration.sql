-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "translations" TEXT[] DEFAULT ARRAY[]::TEXT[];
