import type { AnswerStatus } from "@/utils/checkAnswer";

export function normalizeEnglishWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getNextReviewAt(level: number, result: AnswerStatus, from = new Date()) {
  const intervalsByLevel = [0, 1, 2, 4, 7, 14];
  const boundedLevel = Math.min(5, Math.max(0, level));
  const days = result === "wrong" ? 0 : intervalsByLevel[boundedLevel];
  const nextReviewAt = new Date(from);

  nextReviewAt.setDate(nextReviewAt.getDate() + days);
  return nextReviewAt;
}

export function getReviewUpdateState(
  current: { learningLevel: number; streak: number; isLearned: boolean },
  result: AnswerStatus
) {
  const learningLevel =
    result === "correct"
      ? Math.min(5, current.learningLevel + 1)
      : result === "wrong"
        ? Math.max(0, current.learningLevel - 1)
        : current.learningLevel;

  const streak = result === "correct" ? current.streak + 1 : result === "wrong" ? 0 : current.streak;
  const isLearned =
    result === "wrong" ? false : result === "correct" ? learningLevel >= 5 && streak >= 3 : current.isLearned;

  return {
    learningLevel,
    streak,
    isLearned,
    nextReviewAt: getNextReviewAt(learningLevel, result)
  };
}
