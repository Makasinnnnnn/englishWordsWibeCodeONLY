import type { CardProgress, DictionaryWord } from "@prisma/client";

import { getCardDirection, totalCardReviewStages } from "@/lib/cards/scheduler";

export type CardQueueItem = {
  word: DictionaryWord;
  progress: CardProgress | null;
  cardType: "new" | "rotation";
  direction: "en-ru" | "ru-en";
};

export type CardStats = {
  total: number;
  learned: number;
  rotation: number;
  known: number;
  left: number;
  due: number;
};

export function buildCardQueue(
  words: DictionaryWord[],
  progressItems: CardProgress[],
  options: { now?: Date; includeLearnedOnce?: boolean } = {}
): CardQueueItem[] {
  const now = options.now ?? new Date();
  const progressByWordId = new Map(progressItems.map((item) => [item.dictionaryWordId, item]));

  const due: CardQueueItem[] = [];
  const learnedBonus: CardQueueItem[] = [];
  const fresh: CardQueueItem[] = [];

  for (const word of words) {
    const progress = progressByWordId.get(word.id) ?? null;

    if (!progress) {
      fresh.push({ word, progress: null, cardType: "new", direction: "en-ru" });
      continue;
    }

    if (progress.status === "rotation" && progress.nextReviewAt && progress.nextReviewAt <= now) {
      due.push({
        word,
        progress,
        cardType: "rotation",
        direction: getCardDirection(progress.reviewStage)
      });
      continue;
    }

    if (options.includeLearnedOnce && progress.status === "learned") {
      learnedBonus.push({
        word,
        progress,
        cardType: "rotation",
        direction: getCardDirection(Math.max(0, totalCardReviewStages - 1))
      });
    }
  }

  due.sort((left, right) => {
    const leftTime = left.progress?.nextReviewAt?.getTime() ?? 0;
    const rightTime = right.progress?.nextReviewAt?.getTime() ?? 0;

    return leftTime - rightTime || left.word.position - right.word.position;
  });

  learnedBonus.sort((left, right) => left.word.position - right.word.position);
  fresh.sort((left, right) => {
    const createdDiff = right.word.createdAt.getTime() - left.word.createdAt.getTime();
    return createdDiff || Math.random() - 0.5;
  });

  return [...due, ...learnedBonus, ...fresh];
}

export function buildCardStats(words: DictionaryWord[], progressItems: CardProgress[], now = new Date()): CardStats {
  const total = words.length;
  const learned = progressItems.filter((item) => item.status === "learned").length;
  const rotation = progressItems.filter((item) => item.status === "rotation").length;
  const known = progressItems.filter((item) => item.status === "known").length;
  const due = progressItems.filter(
    (item) => item.status === "rotation" && item.nextReviewAt !== null && item.nextReviewAt <= now
  ).length;

  return {
    total,
    learned,
    rotation,
    known,
    due,
    left: Math.max(0, total - learned - known)
  };
}
