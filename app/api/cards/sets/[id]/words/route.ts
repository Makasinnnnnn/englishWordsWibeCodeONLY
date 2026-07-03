import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { appendWordsToCardSet, clampRandomWordCount, pickRandomDictionaryWordIds } from "@/lib/cards/sets";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const cardSetWordsSchema = z.object({
  wordIds: z.array(z.string().cuid()).max(200).optional(),
  randomCount: z.number().int().min(1).max(100).optional()
});

type RouteContext = {
  params: {
    id: string;
  };
};

async function getUserSet(userId: string, id: string) {
  return prisma.cardSet.findFirst({
    where: { id, userId },
    include: { words: { select: { dictionaryWordId: true } } }
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const payload = cardSetWordsSchema.parse(await request.json());
    const set = await getUserSet(user.id, params.id);

    if (!set) {
      return apiError("Card set not found", { status: 404, code: "CARD_SET_NOT_FOUND" });
    }

    const existingIds = set.words.map((word) => word.dictionaryWordId);
    const explicitIds = payload.wordIds ?? [];
    const validExplicitWords =
      explicitIds.length > 0
        ? await prisma.dictionaryWord.findMany({
            where: { id: { in: explicitIds }, dictionaryId: set.dictionaryId },
            select: { id: true }
          })
        : [];
    const validExplicitIds = validExplicitWords.map((word) => word.id);
    const randomIds = payload.randomCount
      ? await pickRandomDictionaryWordIds(prisma, set.dictionaryId, clampRandomWordCount(payload.randomCount), [
          ...existingIds,
          ...validExplicitIds
        ])
      : [];

    await appendWordsToCardSet(prisma, set.id, [...validExplicitIds, ...randomIds]);
    const updatedSet = await prisma.cardSet.findUnique({
      where: { id: set.id },
      include: {
        words: {
          orderBy: [{ position: "asc" }, { addedAt: "asc" }],
          include: { word: true }
        }
      }
    });

    return NextResponse.json({ ok: true, set: updatedSet });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to add words to card set");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const payload = cardSetWordsSchema.parse(await request.json());
    const set = await prisma.cardSet.findFirst({ where: { id: params.id, userId: user.id } });

    if (!set) {
      return apiError("Card set not found", { status: 404, code: "CARD_SET_NOT_FOUND" });
    }

    await prisma.cardSetWord.deleteMany({
      where: {
        cardSetId: set.id,
        dictionaryWordId: payload.wordIds && payload.wordIds.length > 0 ? { in: payload.wordIds } : undefined
      }
    });
    const updatedSet = await prisma.cardSet.findUnique({
      where: { id: set.id },
      include: {
        words: {
          orderBy: [{ position: "asc" }, { addedAt: "asc" }],
          include: { word: true }
        }
      }
    });

    return NextResponse.json({ ok: true, set: updatedSet });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to remove words from card set");
  }
}
