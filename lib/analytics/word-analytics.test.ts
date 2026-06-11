import type { Word } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { buildWordAnalytics } from "./word-analytics";

function makeWord(overrides: Partial<Word> = {}): Word {
  const now = new Date("2026-06-10T00:00:00.000Z");

  return {
    id: "word-1",
    userId: "user-1",
    english: "apple",
    englishNormalized: "apple",
    translation: "яблоко",
    association: null,
    imageUrl: null,
    notes: null,
    difficulty: "medium",
    learningLevel: 0,
    correctCount: 0,
    wrongCount: 0,
    typoCount: 0,
    reviewCount: 0,
    streak: 0,
    lastResult: null,
    isLearned: false,
    lastReviewedAt: null,
    nextReviewAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

describe("word analytics", () => {
  it("calculates progress and accuracy from words", () => {
    const analytics = buildWordAnalytics(
      [
        makeWord({
          id: "one",
          isLearned: true,
          learningLevel: 5,
          correctCount: 8,
          wrongCount: 1,
          typoCount: 1,
          reviewCount: 10,
          streak: 4,
          lastReviewedAt: new Date("2026-06-09T12:00:00.000Z")
        }),
        makeWord({
          id: "two",
          english: "river",
          translation: "река",
          wrongCount: 3,
          reviewCount: 3,
          nextReviewAt: new Date("2026-06-09T00:00:00.000Z")
        })
      ],
      new Date("2026-06-10T08:00:00.000Z")
    );

    expect(analytics.totalWords).toBe(2);
    expect(analytics.learnedWords).toBe(1);
    expect(analytics.dueToday).toBe(1);
    expect(analytics.overdueWords).toBe(1);
    expect(analytics.accuracy).toBe(62);
    expect(analytics.hardestWords[0]).toMatchObject({ id: "two", wrongCount: 3 });
  });
});
