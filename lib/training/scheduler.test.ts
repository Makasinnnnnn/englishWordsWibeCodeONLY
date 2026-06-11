import { describe, expect, it } from "vitest";

import { getNextReviewAt, getReviewUpdateState } from "./scheduler";

const now = new Date("2026-06-10T00:00:00.000Z");

describe("training scheduler", () => {
  it("schedules correct answers by learning level", () => {
    expect(getNextReviewAt(2, "correct", now).toISOString()).toBe("2026-06-12T00:00:00.000Z");
    expect(getNextReviewAt(5, "correct", now).toISOString()).toBe("2026-06-24T00:00:00.000Z");
  });

  it("keeps typo answers on the same learning level", () => {
    const state = getReviewUpdateState({ learningLevel: 3, streak: 2, isLearned: false }, "typo", now);

    expect(state.learningLevel).toBe(3);
    expect(state.streak).toBe(2);
    expect(state.isLearned).toBe(false);
  });

  it("marks a word learned after enough correct progress", () => {
    const state = getReviewUpdateState({ learningLevel: 4, streak: 2, isLearned: false }, "correct", now);

    expect(state.learningLevel).toBe(5);
    expect(state.streak).toBe(3);
    expect(state.isLearned).toBe(true);
  });

  it("resets streak and learned flag after a wrong answer", () => {
    const state = getReviewUpdateState({ learningLevel: 4, streak: 5, isLearned: true }, "wrong", now);

    expect(state.learningLevel).toBe(3);
    expect(state.streak).toBe(0);
    expect(state.isLearned).toBe(false);
    expect(state.nextReviewAt.toISOString()).toBe("2026-06-10T00:00:00.000Z");
  });
});
