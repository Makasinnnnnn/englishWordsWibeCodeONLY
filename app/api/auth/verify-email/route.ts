import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError } from "@/lib/auth";
import { verifyEmailToken } from "@/lib/auth/email-verification";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { verifyEmailSchema } from "@/lib/validation/auth-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { token } = verifyEmailSchema.parse(await request.json());
    const rateLimit = checkRateLimit(
      makeRateLimitKey("verify-email", getClientIp(request.headers), token.slice(0, 12)),
      10,
      15 * 60 * 1000
    );

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много попыток подтверждения. Попробуйте позже.", 429);
    }

    const result = await verifyEmailToken(token);

    if (!result.ok && result.code === "TOKEN_EXPIRED") {
      return authError("TOKEN_EXPIRED", "Ссылка подтверждения устарела. Запросите новую.", 410);
    }

    if (!result.ok) {
      return authError("VALIDATION_ERROR", "Ссылка подтверждения недействительна.", 400);
    }

    return authOk({ verified: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    return authError("INTERNAL_ERROR", "Не удалось подтвердить email", 500);
  }
}
