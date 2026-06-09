import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError, normalizeAuthEmail } from "@/lib/auth";
import { createPasswordResetSecret, getPasswordResetExpiry } from "@/lib/auth/password-reset";
import { buildPasswordResetUrl, sendPasswordResetEmail } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/auth-schemas";

export const dynamic = "force-dynamic";

const neutralMessage = "Если аккаунт найден, мы отправили ссылку для восстановления пароля.";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const payload = forgotPasswordSchema.parse(await request.json());
    const email = normalizeAuthEmail(payload.email);
    const rateLimit = checkRateLimit(makeRateLimitKey("forgot-password", ip, email), 5, 60 * 60 * 1000);

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много запросов восстановления. Попробуйте позже.", 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.passwordHash) {
      const secret = createPasswordResetSecret();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: secret.tokenHash,
          expiresAt: getPasswordResetExpiry()
        }
      });
      await sendPasswordResetEmail(email, buildPasswordResetUrl(secret.token));
    }

    return authOk({ message: neutralMessage });
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    return authOk({ message: neutralMessage });
  }
}
