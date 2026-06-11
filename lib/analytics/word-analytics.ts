import type { Word } from "@prisma/client";

type WordAnalyticsSource = Pick<
  Word,
  | "id"
  | "english"
  | "translation"
  | "difficulty"
  | "isLearned"
  | "learningLevel"
  | "streak"
  | "correctCount"
  | "wrongCount"
  | "typoCount"
  | "reviewCount"
  | "createdAt"
  | "lastReviewedAt"
  | "nextReviewAt"
>;

export type WordAnalytics = ReturnType<typeof buildWordAnalytics>;

export function buildWordAnalytics(words: WordAnalyticsSource[], now = new Date()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const totalWords = words.length;
  const learnedWords = words.filter((word) => word.isLearned).length;
  const dueToday = words.filter(
    (word) => !word.isLearned && (!word.nextReviewAt || word.nextReviewAt <= endOfToday)
  ).length;
  const overdueWords = words.filter(
    (word) => !word.isLearned && word.nextReviewAt !== null && word.nextReviewAt < startOfToday
  ).length;
  const hardWords = words.filter((word) => word.difficulty === "hard" || word.wrongCount >= 2).length;

  const correctAnswers = words.reduce((sum, word) => sum + word.correctCount, 0);
  const wrongAnswers = words.reduce((sum, word) => sum + word.wrongCount, 0);
  const typoAnswers = words.reduce((sum, word) => sum + word.typoCount, 0);
  const totalAnswers = correctAnswers + wrongAnswers + typoAnswers;
  const totalReviews = words.reduce((sum, word) => sum + word.reviewCount, 0);
  const averageLearningLevel =
    totalWords > 0 ? Number((words.reduce((sum, word) => sum + word.learningLevel, 0) / totalWords).toFixed(1)) : 0;

  return {
    totalWords,
    learnedWords,
    learningWords: totalWords - learnedWords,
    dueToday,
    overdueWords,
    hardWords,
    totalReviews,
    correctAnswers,
    wrongAnswers,
    typoAnswers,
    accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
    currentBestStreak: words.reduce((max, word) => Math.max(max, word.streak), 0),
    averageLearningLevel,
    wordsAddedThisWeek: words.filter((word) => word.createdAt >= startOfWeek).length,
    activeWordsThisWeek: words.filter((word) => word.lastReviewedAt && word.lastReviewedAt >= startOfWeek).length,
    hardestWords: [...words]
      .filter((word) => word.wrongCount > 0 || word.typoCount > 0)
      .sort((left, right) => {
        return (
          right.wrongCount - left.wrongCount || right.typoCount - left.typoCount || right.reviewCount - left.reviewCount
        );
      })
      .slice(0, 5)
      .map((word) => ({
        id: word.id,
        english: word.english,
        translation: word.translation,
        learningLevel: word.learningLevel,
        wrongCount: word.wrongCount,
        typoCount: word.typoCount,
        reviewCount: word.reviewCount
      }))
  };
}
