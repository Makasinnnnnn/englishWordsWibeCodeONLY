import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError, hashPassword } from "@/lib/auth";
import { evaluatePasswordResetToken, hashPasswordResetToken } from "@/lib/auth/password-reset";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/auth-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const payload = resetPasswordSchema.parse(await request.json());
    const rateLimit = checkRateLimit(makeRateLimitKey("reset-password", ip), 8, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много попыток сброса пароля. Попробуйте позже.", 429);
    }

    const tokenHash = hashPasswordResetToken(payload.token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!resetToken) {
      return authError("UNAUTHORIZED", "Ссылка восстановления недействительна или истекла", 400);
    }

    const state = evaluatePasswordResetToken(resetToken);

    if (!state.ok) {
      return authError(
        state.code === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "UNAUTHORIZED",
        "Ссылка восстановления недействительна или истекла",
        400
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: await hashPassword(payload.password) }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      }),
      prisma.session.deleteMany({ where: { userId: resetToken.userId } })
    ]);

    return authOk({ message: "Пароль обновлен. Теперь можно войти заново." });
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    return authError("INTERNAL_ERROR", "Не удалось обновить пароль", 500);
  }
}
