import { NextRequest, NextResponse } from "next/server";

import { getCardAnalytics, normalizeAnalyticsPeriod } from "@/lib/analytics/card-analytics";
import { buildWordAnalytics } from "@/lib/analytics/word-analytics";
import { apiError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const words = await prisma.word.findMany({
      where: { userId: user.id }
    });

    const period = normalizeAnalyticsPeriod(request.nextUrl.searchParams.get("period"));
    const cardAnalytics = await getCardAnalytics(user.id, period);

    return NextResponse.json({
      ok: true,
      data: buildWordAnalytics(words),
      cards: cardAnalytics
    });
  } catch {
    return apiError("Failed to load analytics");
  }
}
