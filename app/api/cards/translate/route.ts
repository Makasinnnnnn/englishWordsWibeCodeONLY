import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCardTranslation } from "@/lib/translate/provider";

export const dynamic = "force-dynamic";

const cardTranslateSchema = z.object({
  word: z.string().trim().min(1),
  wordId: z.string().trim().optional(),
  context: z.string().trim().optional(),
  sourceLang: z.string().trim().default("en"),
  targetLang: z.string().trim().default("ru")
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const payload = cardTranslateSchema.parse(await request.json());
    const result = await getCardTranslation(payload.word, {
      context: payload.context,
      sourceLang: payload.sourceLang,
      targetLang: payload.targetLang
    });

    if (payload.wordId && result.examples[0]) {
      const existingWord = await prisma.dictionaryWord.findUnique({
        where: { id: payload.wordId },
        select: { id: true, exampleEn: true, exampleRu: true, translation: true }
      });

      if (existingWord) {
        await prisma.dictionaryWord.update({
          where: { id: payload.wordId },
          data: {
            translation: existingWord.translation || result.translation || undefined,
            exampleEn: existingWord.exampleEn || result.examples[0].en,
            exampleRu: existingWord.exampleRu || result.examples[0].ru,
            source: result.examples[0].source ?? result.provider
          }
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to translate card word");
  }
}
