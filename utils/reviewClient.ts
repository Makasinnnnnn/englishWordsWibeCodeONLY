import type { AnswerStatus } from "@/utils/checkAnswer";
import type { WordView } from "@/lib/wordSerializer";

export async function saveReview(wordId: string, result: AnswerStatus) {
  const response = await fetch(`/api/words/${wordId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ result })
  });

  if (!response.ok) {
    throw new Error("Failed to save review");
  }

  const data = (await response.json()) as { word: WordView };
  return data.word;
}
