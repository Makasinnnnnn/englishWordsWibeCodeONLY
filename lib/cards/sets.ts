import type { PrismaClient } from "@prisma/client";

export function clampRandomWordCount(value: unknown) {
  const count = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 20;
  return Math.min(100, Math.max(1, count));
}

export function shuffleIds<T extends { id: string }>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5).map((item) => item.id);
}

export async function pickRandomDictionaryWordIds(
  prisma: PrismaClient,
  dictionaryId: string,
  count: number,
  excludeIds: string[] = []
) {
  const words = await prisma.dictionaryWord.findMany({
    where: {
      dictionaryId,
      id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined
    },
    select: { id: true }
  });

  return shuffleIds(words).slice(0, count);
}

export async function appendWordsToCardSet(prisma: PrismaClient, cardSetId: string, wordIds: string[]) {
  if (wordIds.length === 0) {
    return [];
  }

  const uniqueWordIds = Array.from(new Set(wordIds));
  const existingLinks = await prisma.cardSetWord.findMany({
    where: { cardSetId, dictionaryWordId: { in: uniqueWordIds } },
    select: { dictionaryWordId: true }
  });
  const existingIds = new Set(existingLinks.map((link) => link.dictionaryWordId));
  const newWordIds = uniqueWordIds.filter((id) => !existingIds.has(id));

  const currentMax = await prisma.cardSetWord.aggregate({
    where: { cardSetId },
    _max: { position: true }
  });
  const startPosition = (currentMax._max.position ?? -1) + 1;

  if (newWordIds.length > 0) {
    await prisma.cardSetWord.createMany({
      data: newWordIds.map((dictionaryWordId, index) => ({
        cardSetId,
        dictionaryWordId,
        position: startPosition + index
      }))
    });
  }

  return prisma.cardSetWord.findMany({
    where: { cardSetId, dictionaryWordId: { in: uniqueWordIds } },
    orderBy: [{ position: "asc" }, { addedAt: "asc" }],
    include: { word: true }
  });
}
