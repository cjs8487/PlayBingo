-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "translations" JSONB;
ALTER TABLE "Game" ADD COLUMN     "translations" TEXT[] DEFAULT ARRAY[]::TEXT[];