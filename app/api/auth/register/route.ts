import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { authError, authOk, authValidationError, createSession, hashPassword, normalizeAuthEmail } from "@/lib/auth";
import { isPrismaUniqueViolation } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation/auth-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const body = await request.json();
    const payload = registerSchema.parse(body);
    const email = normalizeAuthEmail(payload.email);
    const rateLimit = checkRateLimit(makeRateLimitKey("register", ip, email), 5, 60 * 60 * 1000);

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много регистраций. Попробуйте позже.", 429);
    }

    const user = await prisma.user.create({
      data: {
        email,
        displayName: payload.displayName?.trim() || null,
        passwordHash: await hashPassword(payload.password),
        emailVerifiedAt: null
      },
      select: {
        id: true,
        email: true,
        displayName: true
      }
    });

    await createSession(user.id);

    return authOk({ user }, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return authValidationError(error);
    }

    if (isPrismaUniqueViolation(error)) {
      return authError("CONFLICT", "Аккаунт с таким email уже существует", 409);
    }

    return authError("INTERNAL_ERROR", "Не удалось создать аккаунт", 500);
  }
}
