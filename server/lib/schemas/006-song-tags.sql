-- Up
ALTER TABLE "songs" ADD COLUMN "tags" text NOT NULL DEFAULT('[]');

-- Down
ALTER TABLE "songs" DROP COLUMN "tags";
