import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiError, isPrismaUniqueViolation, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wordMutationSchema } from "@/lib/schemas";
import { normalizeEnglishWord } from "@/lib/wordLogic";
import { serializeWord, serializeWords } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const words = await prisma.word.findMany({
      where: { userId: user.id },
      orderBy: [{ isLearned: "asc" }, { learningLevel: "asc" }, { updatedAt: "desc" }]
    });

    return NextResponse.json({ words: serializeWords(words) });
  } catch {
    return apiError("Failed to load words");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const payload = wordMutationSchema.parse(await request.json());
    const word = await prisma.word.create({
      data: {
        ...payload,
        userId: user.id,
        englishNormalized: normalizeEnglishWord(payload.english)
      }
    });

    return NextResponse.json({ word: serializeWord(word) }, { status: 201 });
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

    return apiError("Failed to create word");
  }
}
