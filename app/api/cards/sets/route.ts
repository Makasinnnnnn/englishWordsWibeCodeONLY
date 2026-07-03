import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { appendWordsToCardSet, clampRandomWordCount, pickRandomDictionaryWordIds } from "@/lib/cards/sets";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const cardSetCreateSchema = z.object({
  dictionaryId: z.string().cuid(),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).optional(),
  randomCount: z.number().int().min(1).max(100).optional(),
  wordIds: z.array(z.string().cuid()).max(200).optional()
});

function serializeSet(set: Awaited<ReturnType<typeof prisma.cardSet.findMany>>[number]) {
  return set;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const dictionaryId = request.nextUrl.searchParams.get("dictionaryId");
    const sets = await prisma.cardSet.findMany({
      where: {
        userId: user.id,
        dictionaryId: dictionaryId ?? undefined
      },
      orderBy: [{ isToday: "desc" }, { updatedAt: "desc" }],
      include: {
        words: {
          orderBy: [{ position: "asc" }, { addedAt: "asc" }],
          include: { word: true }
        }
      }
    });

    return NextResponse.json({ ok: true, sets: sets.map(serializeSet) });
  } catch {
    return apiError("Failed to load card sets");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const payload = cardSetCreateSchema.parse(await request.json());
    const dictionary = await prisma.dictionary.findUnique({ where: { id: payload.dictionaryId } });

    if (!dictionary) {
      return apiError("Card dictionary not found", { status: 404, code: "CARD_DICTIONARY_NOT_FOUND" });
    }

    const set = await prisma.cardSet.create({
      data: {
        userId: user.id,
        dictionaryId: dictionary.id,
        title: payload.title,
        description: payload.description
      }
    });

    const explicitWordIds = payload.wordIds ?? [];
    const randomWordIds =
      payload.randomCount && payload.randomCount > 0
        ? await pickRandomDictionaryWordIds(
            prisma,
            dictionary.id,
            clampRandomWordCount(payload.randomCount),
            explicitWordIds
          )
        : [];
    await appendWordsToCardSet(prisma, set.id, [...explicitWordIds, ...randomWordIds]);

    const fullSet = await prisma.cardSet.findUnique({
      where: { id: set.id },
      include: {
        words: {
          orderBy: [{ position: "asc" }, { addedAt: "asc" }],
          include: { word: true }
        }
      }
    });

    return NextResponse.json({ ok: true, set: fullSet }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to create card set");
  }
}
