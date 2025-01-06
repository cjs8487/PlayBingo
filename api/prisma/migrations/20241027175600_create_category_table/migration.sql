/*
  Warnings:

  - You are about to drop the column `categories` on the `Goal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Goal" RENAME COLUMN "categories" TO "oldCategories";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max" INTEGER NOT NULL DEFAULT 0,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GoalCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_id_key" ON "Category"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Category_gameId_name_key" ON "Category"("gameId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "_GoalCategories_AB_unique" ON "_GoalCategories"("A", "B");

-- CreateIndex
CREATE INDEX "_GoalCategories_B_index" ON "_GoalCategories"("B");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoalCategories" ADD CONSTRAINT "_GoalCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoalCategories" ADD CONSTRAINT "_GoalCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
