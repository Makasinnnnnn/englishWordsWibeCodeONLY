-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "english" TEXT NOT NULL,
    "englishNormalized" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "association" TEXT,
    "imageUrl" TEXT,
    "notes" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "learningLevel" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "typoCount" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastResult" TEXT,
    "isLearned" BOOLEAN NOT NULL DEFAULT false,
    "lastReviewedAt" DATETIME,
    "nextReviewAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Word" ("association", "correctCount", "createdAt", "difficulty", "english", "englishNormalized", "id", "imageUrl", "isLearned", "lastResult", "lastReviewedAt", "learningLevel", "nextReviewAt", "notes", "reviewCount", "streak", "translation", "typoCount", "updatedAt", "wrongCount") SELECT "association", "correctCount", "createdAt", "difficulty", "english", "englishNormalized", "id", "imageUrl", "isLearned", "lastResult", "lastReviewedAt", "learningLevel", "nextReviewAt", "notes", "reviewCount", "streak", "translation", "typoCount", "updatedAt", "wrongCount" FROM "Word";
DROP TABLE "Word";
ALTER TABLE "new_Word" RENAME TO "Word";
CREATE UNIQUE INDEX "Word_englishNormalized_key" ON "Word"("englishNormalized");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
