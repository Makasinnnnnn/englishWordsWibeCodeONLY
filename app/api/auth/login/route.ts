import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError, createSession, normalizeAuthEmail, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/auth-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const body = await request.json();
    const payload = loginSchema.parse(body);
    const rateLimit = checkRateLimit(
      makeRateLimitKey("login", ip, normalizeAuthEmail(payload.email)),
      8,
      15 * 60 * 1000
    );

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много попыток входа. Попробуйте позже.", 429);
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizeAuthEmail(payload.email) }
    });

    if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
      return authError("UNAUTHORIZED", "Неверный email или пароль", 401);
    }

    await createSession(user.id);

    return authOk({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    return authError("INTERNAL_ERROR", "Не удалось войти", 500);
  }
}
