import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { apiError, validationError } from "@/lib/apiResponse";
import { createSession, normalizeAuthEmail, verifyPassword } from "@/lib/auth";
import { authSchema } from "@/lib/authSchemas";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = authSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: normalizeAuthEmail(payload.email) }
    });

    if (!user || !verifyPassword(payload.password, user.passwordHash)) {
      return apiError("Invalid email or password", {
        status: 401,
        code: "INVALID_CREDENTIALS"
      });
    }

    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to log in");
  }
}
