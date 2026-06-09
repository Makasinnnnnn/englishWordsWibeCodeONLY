import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError, createSession } from "@/lib/auth";
import { getTelegramDisplayName, verifyTelegramAuth } from "@/lib/auth/telegram";
import { prisma } from "@/lib/prisma";
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

    const displayName = getTelegramDisplayName(payload);
    const existingTelegram = await prisma.telegramAccount.findUnique({
      where: { telegramId: payload.id },
      include: { user: true }
    });

    const user = existingTelegram
      ? await prisma.user.update({
          where: { id: existingTelegram.userId },
          data: {
            displayName: existingTelegram.user.displayName ?? displayName,
            avatarUrl: payload.photo_url ?? existingTelegram.user.avatarUrl,
            telegram: {
              update: {
                username: payload.username ?? null,
                firstName: payload.first_name ?? null,
                lastName: payload.last_name ?? null,
                photoUrl: payload.photo_url ?? null
              }
            }
          },
          select: { id: true, email: true, displayName: true }
        })
      : await prisma.user.create({
          data: {
            email: null,
            passwordHash: null,
            displayName,
            avatarUrl: payload.photo_url ?? null,
            telegram: {
              create: {
                telegramId: payload.id,
                username: payload.username ?? null,
                firstName: payload.first_name ?? null,
                lastName: payload.last_name ?? null,
                photoUrl: payload.photo_url ?? null
              }
            }
          },
          select: { id: true, email: true, displayName: true }
        });

    await createSession(user.id);

    return authOk({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    return authError("INTERNAL_ERROR", "Не удалось войти через Telegram", 500);
  }
}
