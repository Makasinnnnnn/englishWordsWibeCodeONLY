import type { CardProgress } from "@prisma/client";

export type CardSwipeAction = "known" | "unknown" | "remembered" | "forgot";

export const cardReviewIntervals = [
  { label: "5 минут", ms: 5 * 60 * 1000 },
  { label: "1 час", ms: 60 * 60 * 1000 },
  { label: "1 день", ms: 24 * 60 * 60 * 1000 },
  { label: "1 неделя", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "1 месяц", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "3 месяца", ms: 90 * 24 * 60 * 60 * 1000 }
] as const;

export const totalCardReviewStages = cardReviewIntervals.length;

export function getCardDirection(reviewStage: number) {
  return reviewStage % 2 === 0 ? "en-ru" : "ru-en";
}

export function addMs(from: Date, ms: number) {
  return new Date(from.getTime() + ms);
}

export function getCardNextReviewAt(reviewStage: number, from = new Date()) {
  const boundedStage = Math.min(totalCardReviewStages - 1, Math.max(0, reviewStage));
  return addMs(from, cardReviewIntervals[boundedStage].ms);
}

export function getSwipeProgressUpdate(
  current: Pick<CardProgress, "reviewStage" | "lapseStep" | "resumeStage" | "status"> | null,
  action: CardSwipeAction,
  from = new Date()
) {
  if (action === "known") {
    return {
      status: "known",
      reviewStage: current?.reviewStage ?? 0,
      lapseStep: 0,
      resumeStage: null,
      knownAt: from,
      learnedAt: null,
      lastReviewedAt: from,
      nextReviewAt: null
    };
  }

  if (action === "unknown") {
    return {
      status: "rotation",
      reviewStage: 0,
      lapseStep: 0,
      resumeStage: null,
      knownAt: null,
      learnedAt: null,
      lastReviewedAt: from,
      nextReviewAt: getCardNextReviewAt(0, from)
    };
  }

  if (action === "forgot") {
    const reviewStage = current?.reviewStage ?? 0;

    return {
      status: "rotation",
      reviewStage,
      lapseStep: 1,
      resumeStage: Math.min(reviewStage + 1, totalCardReviewStages),
      knownAt: null,
      learnedAt: null,
      lastReviewedAt: from,
      nextReviewAt: addMs(from, cardReviewIntervals[0].ms)
    };
  }

  const lapseStep = current?.lapseStep ?? 0;

  if (lapseStep === 1) {
    return {
      status: "rotation",
      reviewStage: current?.reviewStage ?? 0,
      lapseStep: 2,
      resumeStage: current?.resumeStage ?? Math.min((current?.reviewStage ?? 0) + 1, totalCardReviewStages),
      knownAt: null,
      learnedAt: null,
      lastReviewedAt: from,
      nextReviewAt: addMs(from, cardReviewIntervals[1].ms)
    };
  }

  const nextStage =
    lapseStep === 2
      ? Math.min(current?.resumeStage ?? (current?.reviewStage ?? 0) + 1, totalCardReviewStages)
      : Math.min((current?.reviewStage ?? 0) + 1, totalCardReviewStages);

  if (nextStage >= totalCardReviewStages) {
    return {
      status: "learned",
      reviewStage: totalCardReviewStages,
      lapseStep: 0,
      resumeStage: null,
      knownAt: null,
      learnedAt: from,
      lastReviewedAt: from,
      nextReviewAt: null
    };
  }

  return {
    status: "rotation",
    reviewStage: nextStage,
    lapseStep: 0,
    resumeStage: null,
    knownAt: null,
    learnedAt: null,
    lastReviewedAt: from,
    nextReviewAt: getCardNextReviewAt(nextStage, from)
  };
}
