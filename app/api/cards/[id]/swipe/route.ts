import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { getSwipeProgressUpdate } from "@/lib/cards/scheduler";
import { serializeCardProgress } from "@/lib/cards/serializer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const swipeActionSchema = z.object({
  action: z.enum(["known", "unknown", "remembered", "forgot"])
});

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

    const { action } = swipeActionSchema.parse(await request.json());
    const word = await prisma.dictionaryWord.findUnique({
      where: { id: params.id },
      select: { id: true }
    });

    if (!word) {
      return apiError("Card word not found", { status: 404, code: "CARD_WORD_NOT_FOUND" });
    }

    const currentProgress = await prisma.cardProgress.findUnique({
      where: {
        userId_dictionaryWordId: {
          userId: user.id,
          dictionaryWordId: params.id
        }
      }
    });

    const now = new Date();
    const nextState = getSwipeProgressUpdate(currentProgress, action, now);
    const progress = await prisma.cardProgress.upsert({
      where: {
        userId_dictionaryWordId: {
          userId: user.id,
          dictionaryWordId: params.id
        }
      },
      create: {
        userId: user.id,
        dictionaryWordId: params.id,
        ...nextState,
        correctCount: action === "remembered" ? 1 : 0,
        wrongCount: action === "forgot" ? 1 : 0,
        reviewCount: action === "remembered" || action === "forgot" ? 1 : 0
      },
      update: {
        ...nextState,
        correctCount: action === "remembered" ? { increment: 1 } : undefined,
        wrongCount: action === "forgot" ? { increment: 1 } : undefined,
        reviewCount: action === "remembered" || action === "forgot" ? { increment: 1 } : undefined
      }
    });
    await prisma.cardReviewEvent.create({
      data: {
        userId: user.id,
        dictionaryWordId: params.id,
        cardProgressId: progress.id,
        action,
        statusBefore: currentProgress?.status ?? null,
        statusAfter: progress.status
      }
    });

    return NextResponse.json({ ok: true, progress: serializeCardProgress(progress) });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to save card progress");
  }
}
