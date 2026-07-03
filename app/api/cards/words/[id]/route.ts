import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiError, isPrismaUniqueViolation, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cardWordUpdateSchema } from "@/lib/schemas";
import { normalizeEnglishWord } from "@/lib/wordLogic";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const payload = cardWordUpdateSchema.parse(await request.json());
    const existing = await prisma.dictionaryWord.findUnique({ where: { id: params.id } });

    if (!existing) {
      return apiError("Card word not found", { status: 404, code: "CARD_WORD_NOT_FOUND" });
    }

    const word = await prisma.dictionaryWord.update({
      where: { id: params.id },
      data: {
        english: payload.english,
        englishNormalized: payload.english ? normalizeEnglishWord(payload.english) : undefined,
        transcription: payload.transcription,
        translation: payload.translation,
        exampleEn: payload.exampleEn,
        exampleRu: payload.exampleRu,
        source: payload.source,
        position: payload.position
      }
    });

    return NextResponse.json({ ok: true, word });
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

    return apiError("Failed to update card word");
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const result = await prisma.dictionaryWord.deleteMany({
      where: { id: params.id }
    });

    if (result.count === 0) {
      return apiError("Card word not found", { status: 404, code: "CARD_WORD_NOT_FOUND" });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return apiError("Failed to delete card word");
  }
}
