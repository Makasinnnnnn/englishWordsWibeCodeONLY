import type { CardProgress, Dictionary, DictionaryWord } from "@prisma/client";

import type { CardQueueItem, CardStats } from "@/lib/cards/queue";

export type CardProgressView = Omit<
  CardProgress,
  "createdAt" | "updatedAt" | "knownAt" | "learnedAt" | "lastReviewedAt" | "nextReviewAt"
> & {
  createdAt: string;
  updatedAt: string;
  knownAt: string | null;
  learnedAt: string | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
};

export type DictionaryWordView = Omit<DictionaryWord, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type CardQueueItemView = {
  word: DictionaryWordView;
  progress: CardProgressView | null;
  cardType: "new" | "rotation";
  direction: "en-ru" | "ru-en";
};

export type DictionaryView = Omit<Dictionary, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type CardDeckView = {
  dictionary: DictionaryView;
  cardSet: {
    id: string;
    title: string;
    description: string | null;
    wordCount: number;
  } | null;
  queue: CardQueueItemView[];
  stats: CardStats;
};

export function serializeCardProgress(progress: CardProgress): CardProgressView {
  return {
    ...progress,
    createdAt: progress.createdAt.toISOString(),
    updatedAt: progress.updatedAt.toISOString(),
    knownAt: progress.knownAt ? progress.knownAt.toISOString() : null,
    learnedAt: progress.learnedAt ? progress.learnedAt.toISOString() : null,
    lastReviewedAt: progress.lastReviewedAt ? progress.lastReviewedAt.toISOString() : null,
    nextReviewAt: progress.nextReviewAt ? progress.nextReviewAt.toISOString() : null
  };
}

export function serializeDictionaryWord(word: DictionaryWord): DictionaryWordView {
  return {
    ...word,
    createdAt: word.createdAt.toISOString(),
    updatedAt: word.updatedAt.toISOString()
  };
}

export function serializeCardQueue(items: CardQueueItem[]): CardQueueItemView[] {
  return items.map((item) => ({
    ...item,
    word: serializeDictionaryWord(item.word),
    progress: item.progress ? serializeCardProgress(item.progress) : null
  }));
}

export function serializeDictionary(dictionary: Dictionary): DictionaryView {
  return {
    ...dictionary,
    createdAt: dictionary.createdAt.toISOString(),
    updatedAt: dictionary.updatedAt.toISOString()
  };
}
