-- CreateEnum
CREATE TYPE "GenerationListMode" AS ENUM ('NONE');

-- CreateEnum
CREATE TYPE "GenerationListTransform" AS ENUM ('NONE');

-- CreateEnum
CREATE TYPE "GenerationBoardLayout" AS ENUM ('NONE', 'SRLv5', 'ISAAC');

-- CreateEnum
CREATE TYPE "GenerationGoalSelection" AS ENUM ('RANDOM', 'DIFFICULTY');

-- CreateEnum
CREATE TYPE "GenerationGoalRestriction" AS ENUM ('LINE_TYPE_EXCLUSION');

-- CreateEnum
CREATE TYPE "GenerationGlobalAdjustments" AS ENUM ('SYNERGIZE', 'BOARD_TYPE_MAX');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "generationBoardLayout" "GenerationBoardLayout" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "generationGlobalAdjustments" "GenerationGlobalAdjustments"[] DEFAULT ARRAY[]::"GenerationGlobalAdjustments"[],
ADD COLUMN     "generationGoalRestrictions" "GenerationGoalRestriction"[] DEFAULT ARRAY[]::"GenerationGoalRestriction"[],
ADD COLUMN     "generationGoalSelection" "GenerationGoalSelection" NOT NULL DEFAULT 'RANDOM',
ADD COLUMN     "generationListMode" "GenerationListMode"[] DEFAULT ARRAY[]::"GenerationListMode"[],
ADD COLUMN     "generationListTransform" "GenerationListTransform" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "newGeneratorBeta" BOOLEAN NOT NULL DEFAULT false;

-- data migration
UPDATE "Game"
SET "generationBoardLayout"='SRLv5', 
    "generationGoalSelection"='DIFFICULTY',
    "generationGoalRestrictions"='{"LINE_TYPE_EXCLUSION"}',
    "generationGlobalAdjustments"='{"BOARD_TYPE_MAX"}'
WHERE "enableSRLv5"=true;