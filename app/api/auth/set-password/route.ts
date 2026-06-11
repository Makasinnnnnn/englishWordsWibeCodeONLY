import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError, getCurrentUser, hashPassword, normalizeAuthEmail } from "@/lib/auth";
import { sendVerificationForUser } from "@/lib/auth/email-verification";
import { isPrismaUniqueViolation } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { setPasswordSchema } from "@/lib/validation/auth-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return authError("UNAUTHORIZED", "Authentication required", 401);
    }

    const ip = getClientIp(request.headers);
    const payload = setPasswordSchema.parse(await request.json());
    const rateLimit = checkRateLimit(makeRateLimitKey("set-password", ip, user.id), 6, 60 * 60 * 1000);

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много попыток обновить пароль. Попробуйте позже.", 429);
    }

    const email = normalizeAuthEmail(payload.email);
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true }
    });
    const emailChanged = currentUser?.email !== email;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        displayName: payload.displayName?.trim() || undefined,
        passwordHash: await hashPassword(payload.password),
        emailVerifiedAt: emailChanged ? null : undefined
      },
      select: {
        id: true,
        email: true,
        displayName: true
      }
    });

    await sendVerificationForUser(user.id);

    return authOk({ user: updated, emailVerificationSent: Boolean(updated.email) });
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    if (isPrismaUniqueViolation(error)) {
      return authError("CONFLICT", "Этот email уже занят", 409);
    }

    return authError("INTERNAL_ERROR", "Не удалось обновить email и пароль", 500);
  }
}
