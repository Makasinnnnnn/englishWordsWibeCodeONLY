import type { Dictionary } from "@prisma/client";

import { defaultCardDictionarySlug } from "@/lib/cardDictionaryData";
import { prisma } from "@/lib/prisma";

export function normalizeDictionaryWordKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function getFallbackDictionary() {
  return prisma.dictionary.findFirst({
    where: { OR: [{ isDefault: true }, { slug: defaultCardDictionarySlug }] },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });
}

export async function getActiveDictionaryForUser(userId: string): Promise<Dictionary | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeDictionaryId: true }
  });

  if (user?.activeDictionaryId) {
    const active = await prisma.dictionary.findUnique({
      where: { id: user.activeDictionaryId }
    });

    if (active) {
      return active;
    }
  }

  const fallback = await getFallbackDictionary();

  if (fallback && user?.activeDictionaryId !== fallback.id) {
    await prisma.user.update({
      where: { id: userId },
      data: { activeDictionaryId: fallback.id }
    });
  }

  return fallback;
}

export async function selectActiveDictionary(userId: string, dictionaryId: string) {
  const dictionary = await prisma.dictionary.findUnique({
    where: { id: dictionaryId }
  });

  if (!dictionary) {
    return null;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { activeDictionaryId: dictionary.id }
  });

  return dictionary;
}
