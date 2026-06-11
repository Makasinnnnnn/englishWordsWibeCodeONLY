import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { suggestTranslation } from "@/lib/mockSuggestions";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { suggestionQuerySchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const rateLimit = checkRateLimit(
      makeRateLimitKey("suggest-translation", getClientIp(request.headers), user.id),
      40,
      15 * 60 * 1000
    );

    if (!rateLimit.allowed) {
      return apiError("Too many suggestion requests. Please try again later.", {
        status: 429,
        code: "RATE_LIMITED",
        issues: { retryAfterSeconds: rateLimit.retryAfterSeconds }
      });
    }

    const { word } = suggestionQuerySchema.parse({
      word: request.nextUrl.searchParams.get("word") ?? ""
    });
    const translation = suggestTranslation(word);

    return NextResponse.json({
      translation,
      message: translation ? "Mock translation found" : "Введите перевод вручную"
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to suggest translation");
  }
}
