import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError, createSession } from "@/lib/auth";
import { findOrCreateUserForTelegram } from "@/lib/auth/telegram-account";
import { verifyTelegramAuth } from "@/lib/auth/telegram";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { telegramAuthSchema } from "@/lib/validation/auth-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const payload = telegramAuthSchema.parse(await request.json());
    const rateLimit = checkRateLimit(makeRateLimitKey("telegram", ip, payload.id), 10, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много попыток входа через Telegram. Попробуйте позже.", 429);
    }

    if (!verifyTelegramAuth(payload)) {
      return authError("TELEGRAM_AUTH_FAILED", "Не удалось подтвердить вход через Telegram", 401);
    }

    const user = await findOrCreateUserForTelegram(payload);
    await createSession(user.id);

    return authOk({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    return authError("INTERNAL_ERROR", "Не удалось войти через Telegram", 500);
  }
}
