-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "spectator" BOOLEAN NOT NULL,
    "monitor" BOOLEAN NOT NULL DEFAULT false,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_id_key" ON "Player"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Player_key_roomId_key" ON "Player"("key", "roomId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
