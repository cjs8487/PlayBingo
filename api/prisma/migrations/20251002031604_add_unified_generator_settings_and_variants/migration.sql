/*
  Warnings:

  - You are about to drop the `GoalVariant` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `gameId` on table `Variant` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "GoalVariant" DROP CONSTRAINT "GoalVariant_goalId_fkey";

-- DropForeignKey
ALTER TABLE "GoalVariant" DROP CONSTRAINT "GoalVariant_variantId_fkey";

-- DropForeignKey
ALTER TABLE "Variant" DROP CONSTRAINT "Variant_gameId_fkey";

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "generatorSettings" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "generatorSettings" JSONB,
ALTER COLUMN "gameId" SET NOT NULL;

-- DropTable
DROP TABLE "GoalVariant";

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
