import type { WordView } from "@/lib/wordSerializer";

export function sortWordsForTraining(words: WordView[]) {
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

export function buildMultipleChoiceOptions(correct: string, allOptions: string[]) {
  const fallback = ["memory", "lesson", "picture", "answer", "practice", "example"];
  const uniqueDistractors = Array.from(
    new Set(
      allOptions
        .filter((option) => option.trim().toLowerCase() !== correct.trim().toLowerCase())
        .concat(fallback)
    )
  ).slice(0, 3);

  return shuffleArray([correct, ...uniqueDistractors].slice(0, 4));
}

export function shuffleArray<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}
