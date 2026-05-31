export type AnswerStatus = "correct" | "typo" | "wrong";

export type CheckAnswerResult = {
  status: AnswerStatus;
  distance: number;
  message: string;
};

export function normalizeAnswer(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function levenshteinDistance(a: string, b: string) {
  const left = normalizeAnswer(a);
  const right = normalizeAnswer(b);

  if (left === right) {
    return 0;
  }

  if (left.length === 0) {
    return right.length;
  }

  if (right.length === 0) {
    return left.length;
  }

  const matrix = Array.from({ length: left.length + 1 }, (_, index) => [index]);

  for (let column = 1; column <= right.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost
      );
    }
  }

  return matrix[left.length][right.length];
}

export function checkAnswer(userAnswer: string, correctAnswer: string): CheckAnswerResult {
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);
  const distance = levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer);

  if (normalizedUserAnswer === normalizedCorrectAnswer) {
    return {
      status: "correct",
      distance,
      message: "Правильно!"
    };
  }

  const typoThreshold = normalizedCorrectAnswer.length >= 8 ? 2 : 1;

  if (distance <= typoThreshold) {
    return {
      status: "typo",
      distance,
      message: "Почти правильно, проверь написание."
    };
  }

  return {
    status: "wrong",
    distance,
    message: `Неправильно. Правильный ответ: ${correctAnswer}`
  };
}
