import type { Word } from "@prisma/client";

export type WordView = Omit<Word, "createdAt" | "updatedAt" | "lastReviewedAt"> & {
  createdAt: string;
  updatedAt: string;
  lastReviewedAt: string | null;
};

export function serializeWord(word: Word): WordView {
  return {
    ...word,
    createdAt: word.createdAt.toISOString(),
    updatedAt: word.updatedAt.toISOString(),
    lastReviewedAt: word.lastReviewedAt ? word.lastReviewedAt.toISOString() : null
  };
}

export function serializeWords(words: Word[]) {
  return words.map(serializeWord);
}
