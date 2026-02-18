-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "generatorSettings" SET DEFAULT '{"goalFilters":[],"goalTransformation":[],"boardLayout":{"mode":"random"},"restrictions":[],"adjustments":[]}';

-- AlterTable
ALTER TABLE "Variant" ALTER COLUMN "generatorSettings" SET DEFAULT '{"goalFilters":[],"goalTransformation":[],"boardLayout":{"mode":"random"},"restrictions":[],"adjustments":[]}';
