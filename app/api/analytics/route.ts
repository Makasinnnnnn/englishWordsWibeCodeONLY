import { NextResponse } from "next/server";

import { buildWordAnalytics } from "@/lib/analytics/word-analytics";
import { apiError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const words = await prisma.word.findMany({
      where: { userId: user.id }
    });

    return NextResponse.json({
      ok: true,
      data: buildWordAnalytics(words)
    });
  } catch {
    return apiError("Failed to load analytics");
  }
}
