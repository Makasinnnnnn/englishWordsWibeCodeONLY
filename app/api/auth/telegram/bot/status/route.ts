import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError, createSession, getCurrentUser, hashOpaqueToken } from "@/lib/auth";
import { findOrCreateUserForTelegram, linkTelegramProfileToUser } from "@/lib/auth/telegram-account";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { telegramBotTokenSchema } from "@/lib/validation/auth-schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { token } = telegramBotTokenSchema.parse({
      token: request.nextUrl.searchParams.get("token")
    });
    const ip = getClientIp(request.headers);
    const rateLimit = checkRateLimit(
      makeRateLimitKey("telegram-bot-status", ip, token.slice(0, 12)),
      60,
      10 * 60 * 1000
    );

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много проверок Telegram. Попробуйте позже.", 429);
    }

    const loginToken = await prisma.telegramLoginToken.findUnique({
      where: { tokenHash: hashOpaqueToken(token) }
    });

    if (!loginToken || loginToken.expiresAt.getTime() <= Date.now()) {
      return authError("TOKEN_EXPIRED", "Ссылка Telegram устарела. Попробуйте ещё раз.", 410);
    }

    if (loginToken.usedAt) {
      return authError("TOKEN_EXPIRED", "Эта ссылка Telegram уже использована.", 410);
    }

    if (!loginToken.telegramId) {
      return authOk({ status: "pending" });
    }

    const telegramProfile = {
      id: loginToken.telegramId,
      username: loginToken.username,
      first_name: loginToken.firstName,
      last_name: loginToken.lastName,
      photo_url: loginToken.photoUrl
    };

    if (loginToken.purpose === "link") {
      const user = await getCurrentUser();

      if (!user || loginToken.userId !== user.id) {
        return authError("FORBIDDEN", "Эта Telegram-ссылка относится к другому аккаунту", 403);
      }

      const result = await linkTelegramProfileToUser(user.id, telegramProfile);

      if (!result.ok && result.code === "TELEGRAM_TAKEN") {
        return authError("CONFLICT", "Этот Telegram уже привязан к другому аккаунту", 409);
      }

      if (!result.ok && result.code === "USER_HAS_TELEGRAM") {
        return authError("CONFLICT", "Сначала отвяжите текущий Telegram-аккаунт", 409);
      }

      if (!result.ok) {
        return authError("CONFLICT", "Не удалось привязать этот Telegram-аккаунт", 409);
      }

      await prisma.telegramLoginToken.update({
        where: { id: loginToken.id },
        data: { usedAt: new Date() }
      });

      return authOk({ status: "linked", telegram: result.telegram });
    }

    const user = await findOrCreateUserForTelegram(telegramProfile);
    await createSession(user.id);
    await prisma.telegramLoginToken.update({
      where: { id: loginToken.id },
      data: { usedAt: new Date() }
    });

    return authOk({ status: "confirmed", user });
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    return authError("INTERNAL_ERROR", "Не удалось проверить Telegram вход", 500);
  }
}
