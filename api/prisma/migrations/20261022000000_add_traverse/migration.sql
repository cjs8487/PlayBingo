ALTER TYPE "BingoMode" ADD VALUE 'TRAVERSE';

CREATE TYPE "TraversalDirection" AS ENUM ('UP', 'DOWN', 'LEFT', 'RIGHT');

ALTER TABLE "Room"
ADD COLUMN "traversalDirection" "TraversalDirection" NOT NULL DEFAULT 'UP';
