import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/schemas";
import { serializeWord } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { result } = reviewSchema.parse(await request.json());
    const existingWord = await prisma.word.findUnique({
      where: { id: params.id }
    });

    if (!existingWord) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const nextLevel =
      result === "correct"
        ? Math.min(5, existingWord.learningLevel + 1)
        : result === "wrong"
          ? Math.max(0, existingWord.learningLevel - 1)
          : existingWord.learningLevel;

    const word = await prisma.word.update({
      where: { id: params.id },
      data: {
        correctCount: result === "correct" ? { increment: 1 } : undefined,
        typoCount: result === "typo" ? { increment: 1 } : undefined,
        wrongCount: result === "wrong" ? { increment: 1 } : undefined,
        learningLevel: nextLevel,
        isLearned: result === "wrong" ? false : nextLevel >= 5,
        lastReviewedAt: new Date()
      }
    });

    return NextResponse.json({ word: serializeWord(word) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid review result", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
