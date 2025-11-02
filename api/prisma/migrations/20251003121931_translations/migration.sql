-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "translations" TEXT[] DEFAULT ARRAY[]::TEXT[];

/*
  Warnings:

  - Made the column `translations` on table `Goal` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "defaultLanguage" TEXT NOT NULL DEFAULT 'English';

-- AlterTable
ALTER TABLE "Goal" ALTER COLUMN "translations" SET NOT NULL,
ALTER COLUMN "translations" SET DEFAULT '{}';