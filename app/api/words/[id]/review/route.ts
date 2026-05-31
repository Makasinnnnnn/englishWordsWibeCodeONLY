import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/schemas";
import { getReviewUpdateState } from "@/lib/wordLogic";
import { serializeWord } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const { result } = reviewSchema.parse(await request.json());
    const existingWord = await prisma.word.findFirst({
      where: { id: params.id, userId: user.id }
    });

    if (!existingWord) {
      return apiError("Word not found", { status: 404, code: "WORD_NOT_FOUND" });
    }

    const nextState = getReviewUpdateState(existingWord, result);
    const reviewedAt = new Date();

    const word = await prisma.word.update({
      where: { id: params.id },
      data: {
        correctCount: result === "correct" ? { increment: 1 } : undefined,
        typoCount: result === "typo" ? { increment: 1 } : undefined,
        wrongCount: result === "wrong" ? { increment: 1 } : undefined,
        reviewCount: { increment: 1 },
        learningLevel: nextState.learningLevel,
        streak: nextState.streak,
        isLearned: nextState.isLearned,
        lastResult: result,
        lastReviewedAt: reviewedAt,
        nextReviewAt: nextState.nextReviewAt
      }
    });

    return NextResponse.json({ word: serializeWord(word) });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to save review");
  }
}
