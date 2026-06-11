import { describe, expect, it } from "vitest";

import { suggestionQuerySchema, wordMutationSchema } from "./schemas";

describe("word schemas", () => {
  it("accepts http image urls and data images", () => {
    expect(
      wordMutationSchema.safeParse({
        english: "book",
        translation: "книга",
        imageUrl: "https://example.com/book.png"
      }).success
    ).toBe(true);

    expect(
      wordMutationSchema.safeParse({
        english: "book",
        translation: "книга",
        imageUrl: "data:image/png;base64,abc"
      }).success
    ).toBe(true);
  });

  it("rejects non-http remote image urls", () => {
    expect(
      wordMutationSchema.safeParse({
        english: "book",
        translation: "книга",
        imageUrl: "javascript:alert(1)"
      }).success
    ).toBe(false);
  });

  it("validates suggestion query length", () => {
    expect(suggestionQuerySchema.safeParse({ word: "apple" }).success).toBe(true);
    expect(suggestionQuerySchema.safeParse({ word: "" }).success).toBe(false);
  });
});
