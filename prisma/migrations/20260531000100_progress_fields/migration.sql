-- Add normalized lookup and richer review state.
ALTER TABLE "Word" ADD COLUMN "englishNormalized" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Word" ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Word" ADD COLUMN "streak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Word" ADD COLUMN "lastResult" TEXT;
ALTER TABLE "Word" ADD COLUMN "nextReviewAt" DATETIME;

UPDATE "Word"
SET "englishNormalized" = lower(trim("english"))
WHERE "englishNormalized" = '';

CREATE UNIQUE INDEX "Word_englishNormalized_key" ON "Word"("englishNormalized");
