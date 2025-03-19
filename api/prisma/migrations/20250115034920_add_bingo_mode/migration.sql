-- CreateEnum
CREATE TYPE "BingoMode" AS ENUM ('LINES', 'BLACKOUT', 'LOCKOUT');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "bingoMode" "BingoMode" NOT NULL DEFAULT 'LINES',
ADD COLUMN     "lineCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "_GameFavorites" ADD CONSTRAINT "_GameFavorites_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GameFavorites_AB_unique";

-- AlterTable
ALTER TABLE "_GameModerators" ADD CONSTRAINT "_GameModerators_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GameModerators_AB_unique";

-- AlterTable
ALTER TABLE "_GameOwners" ADD CONSTRAINT "_GameOwners_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GameOwners_AB_unique";

-- AlterTable
ALTER TABLE "_GoalCategories" ADD CONSTRAINT "_GoalCategories_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GoalCategories_AB_unique";
