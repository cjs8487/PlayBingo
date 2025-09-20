-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "meta" JSONB;

-- Add constraint to limit meta JSON size to 1024 characters
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_meta_size_check" 
CHECK ("meta" IS NULL OR LENGTH("meta"::text) <= 4096);
