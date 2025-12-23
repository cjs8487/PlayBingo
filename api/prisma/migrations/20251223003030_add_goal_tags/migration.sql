-- CreateTable
CREATE TABLE "GoalTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "GoalTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GoalTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GoalTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalTag_id_key" ON "GoalTag"("id");

-- CreateIndex
CREATE INDEX "_GoalTags_B_index" ON "_GoalTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "GoalTag_gameId_name_key" ON "GoalTag"("gameId", "name");

-- AddForeignKey
ALTER TABLE "GoalTag" ADD CONSTRAINT "GoalTag_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoalTags" ADD CONSTRAINT "_GoalTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GoalTags" ADD CONSTRAINT "_GoalTags_B_fkey" FOREIGN KEY ("B") REFERENCES "GoalTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
