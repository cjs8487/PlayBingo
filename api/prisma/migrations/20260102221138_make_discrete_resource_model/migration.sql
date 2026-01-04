-- CreateTable
CREATE TABLE "GameResource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "GameResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameResource_id_key" ON "GameResource"("id");

-- AddForeignKey
ALTER TABLE "GameResource" ADD CONSTRAINT "GameResource_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
