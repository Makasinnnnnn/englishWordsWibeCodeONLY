import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const cardSetUpdateSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(240).nullable().optional(),
  isToday: z.boolean().optional()
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const payload = cardSetUpdateSchema.parse(await request.json());
    const existing = await prisma.cardSet.findFirst({
      where: { id: params.id, userId: user.id }
    });

    if (!existing) {
      return apiError("Card set not found", { status: 404, code: "CARD_SET_NOT_FOUND" });
    }

    if (payload.isToday) {
      await prisma.cardSet.updateMany({
        where: { userId: user.id, dictionaryId: existing.dictionaryId, id: { not: existing.id } },
        data: { isToday: false }
      });
    }

    const set = await prisma.cardSet.update({
      where: { id: params.id },
      data: {
        title: payload.title,
        description: payload.description,
        isToday: payload.isToday
      },
      include: {
        words: {
          orderBy: [{ position: "asc" }, { addedAt: "asc" }],
          include: { word: true }
        }
      }
    });

    return NextResponse.json({ ok: true, set });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to update card set");
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const result = await prisma.cardSet.deleteMany({
      where: { id: params.id, userId: user.id }
    });

    if (result.count === 0) {
      return apiError("Card set not found", { status: 404, code: "CARD_SET_NOT_FOUND" });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return apiError("Failed to delete card set");
  }
}
