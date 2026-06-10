import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError, createOpaqueToken, getCurrentUser, hashOpaqueToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { telegramBotStartSchema } from "@/lib/validation/auth-schemas";

export const dynamic = "force-dynamic";

const tokenTtlMs = 10 * 60 * 1000;

async function readBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const { mode } = telegramBotStartSchema.parse(await readBody(request));
    const user = mode === "link" ? await getCurrentUser() : null;

    if (mode === "link" && !user) {
      return authError("UNAUTHORIZED", "Нужно войти в аккаунт", 401);
    }

    const rateLimit = checkRateLimit(makeRateLimitKey("telegram-bot-start", ip, user?.id ?? mode), 8, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много попыток входа через Telegram. Попробуйте позже.", 429);
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");

    if (!botUsername || !process.env.TELEGRAM_BOT_TOKEN) {
      return authError("TELEGRAM_AUTH_FAILED", "Telegram вход пока не настроен", 503);
    }

    await prisma.telegramLoginToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }]
      }
    });

    const token = createOpaqueToken();
    const expiresAt = new Date(Date.now() + tokenTtlMs);

    await prisma.telegramLoginToken.create({
      data: {
        tokenHash: hashOpaqueToken(token),
        purpose: mode,
        userId: user?.id ?? null,
        expiresAt
      }
    });

    return authOk({
      token,
      loginUrl: `https://t.me/${botUsername}?start=auth_${token}`,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    return authError("INTERNAL_ERROR", "Не удалось начать вход через Telegram", 500);
  }
}
