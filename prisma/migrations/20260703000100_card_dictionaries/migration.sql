-- Add separate card dictionaries and per-user card progress.

CREATE TABLE "Dictionary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "DictionaryWord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dictionaryId" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "englishNormalized" TEXT NOT NULL,
    "transcription" TEXT,
    "translation" TEXT NOT NULL,
    "exampleEn" TEXT,
    "exampleRu" TEXT,
    "source" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DictionaryWord_dictionaryId_fkey" FOREIGN KEY ("dictionaryId") REFERENCES "Dictionary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CardProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dictionaryWordId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "reviewStage" INTEGER NOT NULL DEFAULT 0,
    "lapseStep" INTEGER NOT NULL DEFAULT 0,
    "resumeStage" INTEGER,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "knownAt" DATETIME,
    "learnedAt" DATETIME,
    "lastReviewedAt" DATETIME,
    "nextReviewAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CardProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CardProgress_dictionaryWordId_fkey" FOREIGN KEY ("dictionaryWordId") REFERENCES "DictionaryWord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Dictionary_slug_key" ON "Dictionary"("slug");
CREATE UNIQUE INDEX "DictionaryWord_dictionaryId_englishNormalized_key" ON "DictionaryWord"("dictionaryId", "englishNormalized");
CREATE INDEX "DictionaryWord_dictionaryId_position_idx" ON "DictionaryWord"("dictionaryId", "position");
CREATE UNIQUE INDEX "CardProgress_userId_dictionaryWordId_key" ON "CardProgress"("userId", "dictionaryWordId");
CREATE INDEX "CardProgress_userId_status_idx" ON "CardProgress"("userId", "status");
CREATE INDEX "CardProgress_userId_nextReviewAt_idx" ON "CardProgress"("userId", "nextReviewAt");
