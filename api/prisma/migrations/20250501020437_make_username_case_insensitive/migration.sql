-- This is an empty migration.
CREATE COLLATION IF NOT EXISTS case_insensitive (provider = icu, locale = 'und-u-ks-level2', deterministic = false);
ALTER TABLE "User" ALTER COLUMN "username" SET DATA TYPE TEXT COLLATE case_insensitive;
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE TEXT COLLATE case_insensitive;