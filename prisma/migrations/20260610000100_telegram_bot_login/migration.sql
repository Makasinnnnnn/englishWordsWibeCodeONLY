CREATE TABLE "TelegramLoginToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'auth',
    "userId" TEXT,
    "telegramId" TEXT,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "TelegramLoginToken_tokenHash_key" ON "TelegramLoginToken"("tokenHash");
CREATE INDEX "TelegramLoginToken_expiresAt_idx" ON "TelegramLoginToken"("expiresAt");
CREATE INDEX "TelegramLoginToken_purpose_idx" ON "TelegramLoginToken"("purpose");
CREATE INDEX "TelegramLoginToken_userId_idx" ON "TelegramLoginToken"("userId");
CREATE INDEX "TelegramLoginToken_telegramId_idx" ON "TelegramLoginToken"("telegramId");
