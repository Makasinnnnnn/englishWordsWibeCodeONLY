import { describe, expect, it } from "vitest";

import { parseWordsCsv, wordsToCsv } from "./csv";
import type { WordView } from "../wordSerializer";

const baseWord: WordView = {
  id: "word-1",
  english: "apple",
  translation: "яблоко",
  association: "red fruit",
  imageUrl: "",
  notes: "common word",
  difficulty: "easy",
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
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

describe("CSV import/export", () => {
  it("exports words with the expected header", () => {
    const csv = wordsToCsv([baseWord]);

    expect(csv).toContain("english,translation,association,imageUrl,notes,difficulty");
    expect(csv).toContain("apple,яблоко,red fruit,,common word,easy");
  });

  it("neutralizes spreadsheet formulas on export", () => {
    const csv = wordsToCsv([
      {
        ...baseWord,
        english: '=IMPORTXML("https://example.com")',
        translation: "+SUM(1,2)",
        association: "-cmd",
        notes: "@external"
      }
    ]);

    expect(csv).toContain("'=IMPORTXML");
    expect(csv).toContain("'+SUM(1,2)");
    expect(csv).toContain("'-cmd");
    expect(csv).toContain("'@external");
  });

  it("parses valid words and reports invalid rows", () => {
    const result = parseWordsCsv("english,translation,difficulty\nbook,книга,easy\n,empty,medium");

    expect(result.words).toHaveLength(1);
    expect(result.words[0]).toMatchObject({ english: "book", translation: "книга", difficulty: "easy" });
    expect(result.errors).toEqual([{ row: 3, message: "English word is required" }]);
  });
});
