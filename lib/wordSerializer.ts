import type { Word } from "@prisma/client";

export type WordView = Omit<
  Word,
  "userId" | "englishNormalized" | "createdAt" | "updatedAt" | "lastReviewedAt" | "nextReviewAt"
> & {
  createdAt: string;
  updatedAt: string;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
};

export function serializeWord(word: Word): WordView {
  const { userId: _userId, englishNormalized: _englishNormalized, ...publicWord } = word;

  return {
    ...publicWord,
    createdAt: word.createdAt.toISOString(),
    updatedAt: word.updatedAt.toISOString(),
    lastReviewedAt: word.lastReviewedAt ? word.lastReviewedAt.toISOString() : null,
    nextReviewAt: word.nextReviewAt ? word.nextReviewAt.toISOString() : null
  };
}

export function serializeWords(words: Word[]) {
  return words.map(serializeWord);
}
