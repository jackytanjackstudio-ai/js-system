-- Content OS v2: add new fields to CreatorContent (all additive, no data loss)
ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "contentUrl"      TEXT;
ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "contentType"     TEXT;
ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "productTags"     TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "signalScore"     DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "aiSignals"       TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "CreatorContent" ADD COLUMN IF NOT EXISTS "pushedToWarRoom" BOOLEAN NOT NULL DEFAULT false;
