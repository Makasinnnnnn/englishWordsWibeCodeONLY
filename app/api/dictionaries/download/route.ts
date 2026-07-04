import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { syncDictionaryFromCatalog } from "@/lib/dictionaries/catalog";

export const dynamic = "force-dynamic";

const dictionaryRequestSchema = z.object({
  slug: z.string().trim().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const { slug } = dictionaryRequestSchema.parse(await request.json());
    const result = await syncDictionaryFromCatalog(slug);

    if (!result) {
      return apiError("Dictionary not found in catalog", { status: 404, code: "DICTIONARY_NOT_FOUND" });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to download dictionary");
  }
}
