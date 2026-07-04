import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { selectActiveDictionary } from "@/lib/dictionaries/active";

export const dynamic = "force-dynamic";

const selectDictionarySchema = z.object({
  dictionaryId: z.string().trim().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const { dictionaryId } = selectDictionarySchema.parse(await request.json());
    const dictionary = await selectActiveDictionary(user.id, dictionaryId);

    if (!dictionary) {
      return apiError("Dictionary not found", { status: 404, code: "DICTIONARY_NOT_FOUND" });
    }

    return NextResponse.json({
      ok: true,
      dictionary: {
        id: dictionary.id,
        slug: dictionary.slug,
        title: dictionary.title,
        level: dictionary.level,
        version: dictionary.version
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to select dictionary");
  }
}
