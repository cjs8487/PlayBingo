-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "count" INTEGER,
ADD COLUMN     "goalImageId" TEXT,
ADD COLUMN     "goalImageTagId" TEXT,
ADD COLUMN     "secondaryGoalImageId" TEXT;

-- CreateTable
CREATE TABLE "GoalImage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mediaFile" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "GoalImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalImageTag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "GoalImageTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalImage_id_key" ON "GoalImage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "GoalImageTag_id_key" ON "GoalImageTag"("id");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_goalImageId_fkey" FOREIGN KEY ("goalImageId") REFERENCES "GoalImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_secondaryGoalImageId_fkey" FOREIGN KEY ("secondaryGoalImageId") REFERENCES "GoalImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_goalImageTagId_fkey" FOREIGN KEY ("goalImageTagId") REFERENCES "GoalImageTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalImage" ADD CONSTRAINT "GoalImage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalImageTag" ADD CONSTRAINT "GoalImageTag_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
