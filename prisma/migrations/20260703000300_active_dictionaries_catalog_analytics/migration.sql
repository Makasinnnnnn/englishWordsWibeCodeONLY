-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "activeDictionaryId" TEXT,
    "emailVerifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "displayName", "email", "emailVerifiedAt", "id", "passwordHash", "updatedAt", "username") SELECT "avatarUrl", "createdAt", "displayName", "email", "emailVerifiedAt", "id", "passwordHash", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE TABLE "new_Dictionary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dictionary" ("createdAt", "description", "id", "isDefault", "level", "slug", "sourceName", "sourceUrl", "title", "updatedAt") SELECT "createdAt", "description", "id", "isDefault", "level", "slug", "sourceName", "sourceUrl", "title", "updatedAt" FROM "Dictionary";
DROP TABLE "Dictionary";
ALTER TABLE "new_Dictionary" RENAME TO "Dictionary";
CREATE UNIQUE INDEX "Dictionary_slug_key" ON "Dictionary"("slug");

CREATE TABLE "new_DictionaryWord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dictionaryId" TEXT NOT NULL,
    "externalId" TEXT,
    "english" TEXT NOT NULL,
    "englishNormalized" TEXT NOT NULL,
    "transcription" TEXT,
    "translation" TEXT NOT NULL,
    "exampleEn" TEXT,
    "exampleRu" TEXT,
    "source" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DictionaryWord_dictionaryId_fkey" FOREIGN KEY ("dictionaryId") REFERENCES "Dictionary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DictionaryWord" ("createdAt", "dictionaryId", "english", "englishNormalized", "exampleEn", "exampleRu", "id", "position", "source", "transcription", "translation", "updatedAt") SELECT "createdAt", "dictionaryId", "english", "englishNormalized", "exampleEn", "exampleRu", "id", "position", "source", "transcription", "translation", "updatedAt" FROM "DictionaryWord";
DROP TABLE "DictionaryWord";
ALTER TABLE "new_DictionaryWord" RENAME TO "DictionaryWord";
CREATE UNIQUE INDEX "DictionaryWord_dictionaryId_englishNormalized_key" ON "DictionaryWord"("dictionaryId", "englishNormalized");
CREATE INDEX "DictionaryWord_dictionaryId_archived_idx" ON "DictionaryWord"("dictionaryId", "archived");
CREATE INDEX "DictionaryWord_dictionaryId_position_idx" ON "DictionaryWord"("dictionaryId", "position");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateTable
CREATE TABLE "CardReviewEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dictionaryWordId" TEXT NOT NULL,
    "cardProgressId" TEXT,
    "action" TEXT NOT NULL,
    "statusBefore" TEXT,
    "statusAfter" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardReviewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CardReviewEvent_dictionaryWordId_fkey" FOREIGN KEY ("dictionaryWordId") REFERENCES "DictionaryWord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CardReviewEvent_cardProgressId_fkey" FOREIGN KEY ("cardProgressId") REFERENCES "CardProgress" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CardReviewEvent_userId_createdAt_idx" ON "CardReviewEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CardReviewEvent_userId_action_idx" ON "CardReviewEvent"("userId", "action");

-- CreateIndex
CREATE INDEX "CardReviewEvent_dictionaryWordId_createdAt_idx" ON "CardReviewEvent"("dictionaryWordId", "createdAt");

-- CreateTable
CREATE TABLE "DailyContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "englishText" TEXT NOT NULL,
    "russianTranslation" TEXT NOT NULL,
    "textSource" TEXT NOT NULL,
    "videoTitle" TEXT,
    "videoUrl" TEXT,
    "videoSource" TEXT,
    "videoThumbnail" TEXT,
    "youtubeEmbedUrl" TEXT,
    "subtitlesStatus" TEXT NOT NULL DEFAULT 'unknown',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "DailyContent_date_isActive_idx" ON "DailyContent"("date", "isActive");

-- CreateIndex
CREATE INDEX "DailyContent_isActive_updatedAt_idx" ON "DailyContent"("isActive", "updatedAt");
