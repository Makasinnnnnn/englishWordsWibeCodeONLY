import { describe, expect, it } from "vitest";

import { checkAnswer, levenshteinDistance, normalizeAnswer } from "./checkAnswer";

describe("checkAnswer utilities", () => {
  it("normalizes case and extra spaces", () => {
    expect(normalizeAnswer("  APPLE   Pie  ")).toBe("apple pie");
  });

  it("normalizes punctuation and russian ё", () => {
    expect(normalizeAnswer(" Ёжик! ")).toBe("ежик");
    expect(normalizeAnswer("apple, pie")).toBe("apple pie");
  });

  it("calculates levenshtein distance", () => {
    expect(levenshteinDistance("book", "back")).toBe(2);
    expect(levenshteinDistance("cloud", "cloud")).toBe(0);
  });

  it("returns correct for exact normalized answers", () => {
    expect(checkAnswer(" River ", "river").status).toBe("correct");
  });

  it("returns correct for accepted answer variants", () => {
    expect(checkAnswer("домик", "дом, домик / домишко").status).toBe("correct");
  });

  it("returns typo for small spelling mistakes", () => {
    expect(checkAnswer("appl", "apple").status).toBe("typo");
    expect(checkAnswer("associaton", "association").status).toBe("typo");
  });

  it("does not accept empty or very short wrong answers as typos", () => {
    expect(checkAnswer("", "apple").status).toBe("wrong");
    expect(checkAnswer("do", "go").status).toBe("wrong");
  });

  it("returns wrong for distant answers", () => {
    expect(checkAnswer("table", "river").status).toBe("wrong");
  });
});
