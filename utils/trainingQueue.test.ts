import { describe, expect, it } from "vitest";

import type { WordView } from "../lib/wordSerializer";
import { buildMultipleChoiceOptions, sortWordsForTraining } from "./trainingQueue";

function word(overrides: Partial<WordView>): WordView {
  return {
    id: overrides.id ?? "id",
    english: overrides.english ?? "apple",
    translation: overrides.translation ?? "яблоко",
    association: overrides.association ?? null,
    imageUrl: overrides.imageUrl ?? null,
    notes: overrides.notes ?? null,
    difficulty: overrides.difficulty ?? "medium",
    learningLevel: overrides.learningLevel ?? 0,
    correctCount: overrides.correctCount ?? 0,
    wrongCount: overrides.wrongCount ?? 0,
    typoCount: overrides.typoCount ?? 0,
    reviewCount: overrides.reviewCount ?? 0,
    streak: overrides.streak ?? 0,
    lastResult: overrides.lastResult ?? null,
    isLearned: overrides.isLearned ?? false,
    lastReviewedAt: overrides.lastReviewedAt ?? null,
    nextReviewAt: overrides.nextReviewAt ?? null,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-01-01T00:00:00.000Z"
  };
}

describe("training queue", () => {
  it("prioritizes unlearned, due, low-level, error-heavy words", () => {
    const now = Date.parse("2026-05-31T00:00:00.000Z");
    const sorted = sortWordsForTraining(
      [
        word({ id: "learned", isLearned: true, learningLevel: 5 }),
        word({ id: "future", learningLevel: 0, nextReviewAt: "2026-06-10T00:00:00.000Z" }),
        word({ id: "hard", learningLevel: 1, wrongCount: 5, lastReviewedAt: "2026-05-20T00:00:00.000Z" }),
        word({ id: "new", learningLevel: 0, wrongCount: 0 })
      ],
      { now }
    );

    expect(sorted.map((item) => item.id)).toEqual(["new", "hard", "future", "learned"]);
  });

  it("builds unique multiple choice options with the correct answer", () => {
    const options = buildMultipleChoiceOptions("apple", ["apple", "book", "book", "river"]);

    expect(options).toContain("apple");
    expect(new Set(options.map((option) => option.toLowerCase())).size).toBe(options.length);
    expect(options.length).toBe(4);
  });
});
