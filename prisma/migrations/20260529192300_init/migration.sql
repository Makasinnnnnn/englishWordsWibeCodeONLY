-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "english" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "association" TEXT,
    "imageUrl" TEXT,
    "notes" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "learningLevel" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "typoCount" INTEGER NOT NULL DEFAULT 0,
    "isLearned" BOOLEAN NOT NULL DEFAULT false,
    "lastReviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
