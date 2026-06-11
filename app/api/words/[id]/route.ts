import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiError, isPrismaUniqueViolation, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
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
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const word = await prisma.word.findFirst({
      where: { id: params.id, userId: user.id }
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
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const payload = wordUpdateSchema.parse(await request.json());
    const { nextReviewAt, ...restPayload } = payload;
    const updateResult = await prisma.word.updateMany({
      where: { id: params.id, userId: user.id },
      data: {
        ...restPayload,
        englishNormalized: payload.english ? normalizeEnglishWord(payload.english) : undefined,
        nextReviewAt: nextReviewAt === undefined ? undefined : nextReviewAt ? new Date(nextReviewAt) : null
      }
    });

    if (updateResult.count === 0) {
      return apiError("Word not found", { status: 404, code: "WORD_NOT_FOUND" });
    }

    const word = await prisma.word.findFirst({
      where: { id: params.id, userId: user.id }
    });

    if (!word) {
      return apiError("Word not found", { status: 404, code: "WORD_NOT_FOUND" });
    }

    return NextResponse.json({ word: serializeWord(word) });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
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
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const deleteResult = await prisma.word.deleteMany({
      where: { id: params.id, userId: user.id }
    });

    if (deleteResult.count === 0) {
      return apiError("Word not found", { status: 404, code: "WORD_NOT_FOUND" });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return apiError("Failed to delete word");
  }
}
