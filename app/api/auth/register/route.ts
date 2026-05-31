import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiError, isPrismaUniqueViolation, validationError } from "@/lib/apiResponse";
import { authSchema } from "@/lib/authSchemas";
import { createSession, hashPassword, normalizeAuthEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = authSchema.parse(await request.json());
    const user = await prisma.user.create({
      data: {
        email: normalizeAuthEmail(payload.email),
        passwordHash: hashPassword(payload.password)
      },
      select: {
        id: true,
        email: true
      }
    });

    await createSession(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    if (isPrismaUniqueViolation(error)) {
      return apiError("Такой пользователь уже существует", {
        status: 409,
        code: "USER_ALREADY_EXISTS"
      });
    }

    return apiError("Не удалось создать аккаунт");
  }
}
