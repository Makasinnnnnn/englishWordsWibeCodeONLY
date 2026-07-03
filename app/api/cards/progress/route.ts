import { NextRequest, NextResponse } from "next/server";

import { apiError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const dictionaryId = request.nextUrl.searchParams.get("dictionaryId");
    const result = await prisma.cardProgress.deleteMany({
      where: {
        userId: user.id,
        word: dictionaryId ? { dictionaryId } : undefined
      }
    });

    return NextResponse.json({ ok: true, deleted: result.count });
  } catch {
    return apiError("Failed to reset card progress");
  }
}
