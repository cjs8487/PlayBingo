-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "difficultyGroups" INTEGER,
ADD COLUMN     "difficultyVariantsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DifficultyVariant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goalAmounts" INTEGER[],
    "gameId" TEXT,

    CONSTRAINT "DifficultyVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DifficultyVariant_id_key" ON "DifficultyVariant"("id");

-- AddForeignKey
ALTER TABLE "DifficultyVariant" ADD CONSTRAINT "DifficultyVariant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
