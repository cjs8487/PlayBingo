-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "slugWords" TEXT[] DEFAULT ARRAY[]::TEXT[];
