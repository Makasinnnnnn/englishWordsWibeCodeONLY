import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiError, isPrismaUniqueViolation, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { defaultCardDictionarySlug } from "@/lib/cardDictionaryData";
import { prisma } from "@/lib/prisma";
import { cardWordMutationSchema } from "@/lib/schemas";
import { normalizeEnglishWord } from "@/lib/wordLogic";

export const dynamic = "force-dynamic";

async function getTargetDictionary(dictionaryId?: string) {
  if (dictionaryId) {
    return prisma.dictionary.findUnique({ where: { id: dictionaryId } });
  }

  return prisma.dictionary.findFirst({
    where: { OR: [{ isDefault: true }, { slug: defaultCardDictionarySlug }] },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const payload = cardWordMutationSchema.parse(await request.json());
    const dictionary = await getTargetDictionary(payload.dictionaryId);

    if (!dictionary) {
      return apiError("Card dictionary not found", { status: 404, code: "CARD_DICTIONARY_NOT_FOUND" });
    }

    const maxPosition = await prisma.dictionaryWord.aggregate({
      where: { dictionaryId: dictionary.id },
      _max: { position: true }
    });
    const word = await prisma.dictionaryWord.create({
      data: {
        english: payload.english,
        englishNormalized: normalizeEnglishWord(payload.english),
        transcription: payload.transcription,
        translation: payload.translation,
        exampleEn: payload.exampleEn,
        exampleRu: payload.exampleRu,
        source: payload.source ?? "Manual edit",
        position: payload.position ?? (maxPosition._max.position ?? -1) + 1,
        dictionaryId: dictionary.id
      }
    });

    return NextResponse.json({ ok: true, word }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    if (isPrismaUniqueViolation(error)) {
      return apiError("This card word already exists in the dictionary", {
        status: 409,
        code: "CARD_WORD_ALREADY_EXISTS"
      });
    }

    return apiError("Failed to create card word");
  }
}
