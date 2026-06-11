export type AnswerStatus = "correct" | "typo" | "wrong";

export type CheckAnswerResult = {
  status: AnswerStatus;
  distance: number;
  message: string;
};

export function normalizeAnswer(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[.,!?;:()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const answerVariants = correctAnswer
    .split(/[,/;|]+/)
    .map((variant) => normalizeAnswer(variant))
    .filter(Boolean);
  const normalizedCorrectAnswers = answerVariants.length > 0 ? answerVariants : [normalizeAnswer(correctAnswer)];
  const distances = normalizedCorrectAnswers.map((answer) => levenshteinDistance(normalizedUserAnswer, answer));
  const distance = Math.min(...distances);
  const closestAnswer = normalizedCorrectAnswers[distances.indexOf(distance)] ?? normalizedCorrectAnswers[0];

  if (normalizedUserAnswer.length === 0) {
    return {
      status: "wrong",
      distance,
      message: `Неправильно. Правильный ответ: ${correctAnswer}`
    };
  }

  if (normalizedCorrectAnswers.includes(normalizedUserAnswer)) {
    return {
      status: "correct",
      distance,
      message: "Правильно!"
    };
  }

  const typoThreshold = closestAnswer.length >= 8 ? 2 : closestAnswer.length >= 4 ? 1 : 0;

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
