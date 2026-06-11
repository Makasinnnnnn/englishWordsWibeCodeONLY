export { getNextReviewAt, getReviewUpdateState } from "@/lib/training/scheduler";

export function normalizeEnglishWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}
