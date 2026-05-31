import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiError, isPrismaNotFound, isPrismaUniqueViolation, validationError } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { wordUpdateSchema } from "@/lib/schemas";
import { normalizeEnglishWord } from "@/lib/wordLogic";
import { serializeWord } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const word = await prisma.word.findUnique({
      where: { id: params.id }
    });

    if (!word) {
      return apiError("Word not found", { status: 404, code: "WORD_NOT_FOUND" });
    }

    return NextResponse.json({ word: serializeWord(word) });
  } catch {
    return apiError("Failed to load word");
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const payload = wordUpdateSchema.parse(await request.json());
    const { nextReviewAt, ...restPayload } = payload;
    const word = await prisma.word.update({
      where: { id: params.id },
      data: {
        ...restPayload,
        englishNormalized: payload.english ? normalizeEnglishWord(payload.english) : undefined,
        nextReviewAt: nextReviewAt === undefined ? undefined : nextReviewAt ? new Date(nextReviewAt) : null
      }
    });

    return NextResponse.json({ word: serializeWord(word) });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    if (isPrismaNotFound(error)) {
      return apiError("Word not found", { status: 404, code: "WORD_NOT_FOUND" });
    }

    if (isPrismaUniqueViolation(error)) {
      return apiError("This word already exists in your dictionary", {
        status: 409,
        code: "WORD_ALREADY_EXISTS"
      });
    }

    return apiError("Failed to update word");
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await prisma.word.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return apiError("Word not found", { status: 404, code: "WORD_NOT_FOUND" });
    }

    return apiError("Failed to delete word");
  }
}
