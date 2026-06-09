import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError, getCurrentUser } from "@/lib/auth";
import { verifyTelegramAuth } from "@/lib/auth/telegram";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { linkTelegramSchema } from "@/lib/validation/auth-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return authError("UNAUTHORIZED", "Authentication required", 401);
    }
    const ip = getClientIp(request.headers);
    const payload = linkTelegramSchema.parse(await request.json());
    const rateLimit = checkRateLimit(makeRateLimitKey("telegram-link", ip, user.id), 8, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много попыток привязки Telegram. Попробуйте позже.", 429);
    }

    if (!verifyTelegramAuth(payload)) {
      return authError("TELEGRAM_AUTH_FAILED", "Не удалось подтвердить Telegram", 401);
    }

    const existingByTelegramId = await prisma.telegramAccount.findUnique({
      where: { telegramId: payload.id }
    });

    if (existingByTelegramId && existingByTelegramId.userId !== user.id) {
      return authError("CONFLICT", "Этот Telegram уже привязан к другому аккаунту", 409);
    }

    const existingForUser = await prisma.telegramAccount.findUnique({
      where: { userId: user.id }
    });

    if (existingForUser && existingForUser.telegramId !== payload.id) {
      return authError("CONFLICT", "Сначала отвяжите текущий Telegram-аккаунт", 409);
    }

    const telegram = await prisma.telegramAccount.upsert({
      where: { userId: user.id },
      update: {
        telegramId: payload.id,
        username: payload.username ?? null,
        firstName: payload.first_name ?? null,
        lastName: payload.last_name ?? null,
        photoUrl: payload.photo_url ?? null
      },
      create: {
        userId: user.id,
        telegramId: payload.id,
        username: payload.username ?? null,
        firstName: payload.first_name ?? null,
        lastName: payload.last_name ?? null,
        photoUrl: payload.photo_url ?? null
      }
    });

    return authOk({ telegram });
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    return authError("INTERNAL_ERROR", "Не удалось привязать Telegram", 500);
  }
}

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return authError("UNAUTHORIZED", "Authentication required", 401);
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      passwordHash: true,
      telegram: true
    }
  });

  if (!account?.telegram) {
    return authOk({ unlinked: true });
  }

  if (!account.email || !account.passwordHash) {
    return authError("FORBIDDEN", "Сначала добавьте email и пароль, затем можно отвязать Telegram", 403);
  }

  await prisma.telegramAccount.deleteMany({ where: { userId: user.id } });

  return authOk({ unlinked: true });
}
