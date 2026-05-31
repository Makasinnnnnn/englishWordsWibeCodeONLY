import type { WordView } from "@/lib/wordSerializer";

function dueRank(word: WordView, now = Date.now()) {
  if (!word.nextReviewAt) {
    return 0;
  }

  return new Date(word.nextReviewAt).getTime() <= now ? 0 : 1;
}

export function sortWordsForTraining(words: WordView[], options: { shuffleWithinPriority?: boolean; now?: number } = {}) {
  const now = options.now ?? Date.now();
  const withRandomTieBreaker = words.map((word) => ({
    word,
    random: options.shuffleWithinPriority ? Math.random() : 0
  }));

  return withRandomTieBreaker.sort((aItem, bItem) => {
    const a = aItem.word;
    const b = bItem.word;

    if (a.isLearned !== b.isLearned) {
      return Number(a.isLearned) - Number(b.isLearned);
    }

    const aDue = dueRank(a, now);
    const bDue = dueRank(b, now);
    if (aDue !== bDue) {
      return aDue - bDue;
    }

    if (a.learningLevel !== b.learningLevel) {
      return a.learningLevel - b.learningLevel;
    }

    if (a.wrongCount !== b.wrongCount) {
      return b.wrongCount - a.wrongCount;
    }

    const aReviewed = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0;
    const bReviewed = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0;

    if (aReviewed !== bReviewed) {
      return aReviewed - bReviewed;
    }

    return aItem.random - bItem.random;
  }).map((item) => item.word);
}

export function getTrainingQueue(words: WordView[], options: { includeLearned?: boolean; shuffleWithinPriority?: boolean; now?: number } = {}) {
  const candidates = options.includeLearned ? words : words.filter((word) => !word.isLearned);
  return sortWordsForTraining(candidates, options);
}

export function hasDueWords(words: WordView[], now = Date.now()) {
  return words.some((word) => !word.isLearned && dueRank(word, now) === 0);
}

export function legacySortWordsForTraining(words: WordView[]) {
  return [...words].sort((a, b) => {
    if (a.isLearned !== b.isLearned) {
      return Number(a.isLearned) - Number(b.isLearned);
    }

    if (a.learningLevel !== b.learningLevel) {
      return a.learningLevel - b.learningLevel;
    }

    if (a.wrongCount !== b.wrongCount) {
      return b.wrongCount - a.wrongCount;
    }

    const aReviewed = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0;
    const bReviewed = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0;

    return aReviewed - bReviewed;
  });
}

export function buildMultipleChoiceOptions(correct: string, allOptions: string[], fallbackOptions = ["memory", "lesson", "picture", "answer", "practice", "example"]) {
  const normalizedCorrect = correct.trim().toLowerCase();
  const seen = new Set<string>([normalizedCorrect]);
  const distractors: string[] = [];

  for (const option of allOptions.concat(fallbackOptions)) {
    const trimmed = option.trim();
    const normalized = trimmed.toLowerCase();

    if (!trimmed || normalized === normalizedCorrect || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    distractors.push(trimmed);

    if (distractors.length === 3) {
      break;
    }
  }

  return shuffleArray([correct.trim(), ...distractors].slice(0, 4));
}

export function shuffleArray<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}
