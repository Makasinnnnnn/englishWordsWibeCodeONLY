-- Add users and sessions for per-user dictionaries.
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Rebuild Word because SQLite cannot drop a unique constraint in-place.
CREATE TABLE "new_Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Word_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Word" (
    "id",
    "english",
    "englishNormalized",
    "translation",
    "association",
    "imageUrl",
    "notes",
    "difficulty",
    "learningLevel",
    "correctCount",
    "wrongCount",
    "typoCount",
    "reviewCount",
    "streak",
    "lastResult",
    "isLearned",
    "lastReviewedAt",
    "nextReviewAt",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "english",
    "englishNormalized",
    "translation",
    "association",
    "imageUrl",
    "notes",
    "difficulty",
    "learningLevel",
    "correctCount",
    "wrongCount",
    "typoCount",
    "reviewCount",
    "streak",
    "lastResult",
    "isLearned",
    "lastReviewedAt",
    "nextReviewAt",
    "createdAt",
    "updatedAt"
FROM "Word";

DROP TABLE "Word";
ALTER TABLE "new_Word" RENAME TO "Word";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "Word_userId_idx" ON "Word"("userId");
CREATE UNIQUE INDEX "Word_userId_englishNormalized_key" ON "Word"("userId", "englishNormalized");
