import { buildCardQueue, buildCardStats } from "@/lib/cards/queue";
import { serializeCardQueue, serializeDictionary, type CardDeckView } from "@/lib/cards/serializer";
import { defaultCardDictionarySlug } from "@/lib/cardDictionaryData";
import { prisma } from "@/lib/prisma";

export async function getDefaultCardDeck(
  userId: string,
  options: { includeLearnedOnce?: boolean; cardSetId?: string; useTodaySet?: boolean } = {}
) {
  const dictionary = await prisma.dictionary.findFirst({
    where: { OR: [{ isDefault: true }, { slug: defaultCardDictionarySlug }] },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });

  if (!dictionary) {
    return null;
  }

  const cardSet =
    options.cardSetId || options.useTodaySet
      ? await prisma.cardSet.findFirst({
          where: {
            id: options.cardSetId,
            userId,
            dictionaryId: dictionary.id,
            isToday: options.cardSetId ? undefined : true
          },
          include: {
            words: {
              orderBy: [{ position: "asc" }, { addedAt: "asc" }],
              include: { word: true }
            }
          }
        })
      : null;
  const setWordIds = cardSet?.words.map((item) => item.dictionaryWordId) ?? [];

  const [words, progress] = await Promise.all([
    cardSet
      ? Promise.resolve(cardSet.words.map((item) => item.word))
      : prisma.dictionaryWord.findMany({
          where: { dictionaryId: dictionary.id },
          orderBy: [{ position: "asc" }, { english: "asc" }]
        }),
    prisma.cardProgress.findMany({
      where: {
        userId,
        word: {
          dictionaryId: dictionary.id,
          id: cardSet ? { in: setWordIds } : undefined
        }
      }
    })
  ]);

  const queue = buildCardQueue(words, progress, options);
  const stats = buildCardStats(words, progress);

  return {
    dictionary: serializeDictionary(dictionary),
    cardSet: cardSet
      ? {
          id: cardSet.id,
          title: cardSet.title,
          description: cardSet.description,
          wordCount: cardSet.words.length
        }
      : null,
    queue: serializeCardQueue(queue),
    stats
  } satisfies CardDeckView;
}
