CREATE TABLE "CardSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dictionaryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isToday" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CardSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CardSet_dictionaryId_fkey" FOREIGN KEY ("dictionaryId") REFERENCES "Dictionary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CardSetWord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardSetId" TEXT NOT NULL,
    "dictionaryWordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardSetWord_cardSetId_fkey" FOREIGN KEY ("cardSetId") REFERENCES "CardSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CardSetWord_dictionaryWordId_fkey" FOREIGN KEY ("dictionaryWordId") REFERENCES "DictionaryWord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CardSet_userId_dictionaryId_idx" ON "CardSet"("userId", "dictionaryId");
CREATE INDEX "CardSet_userId_isToday_idx" ON "CardSet"("userId", "isToday");
CREATE UNIQUE INDEX "CardSetWord_cardSetId_dictionaryWordId_key" ON "CardSetWord"("cardSetId", "dictionaryWordId");
CREATE INDEX "CardSetWord_cardSetId_position_idx" ON "CardSetWord"("cardSetId", "position");
CREATE INDEX "CardSetWord_dictionaryWordId_idx" ON "CardSetWord"("dictionaryWordId");
