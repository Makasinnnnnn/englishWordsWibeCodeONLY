import { NextResponse } from "next/server";

import { apiError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { readDictionaryCatalog } from "@/lib/dictionaries/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const [catalog, localDictionaries, freshUser] = await Promise.all([
      readDictionaryCatalog(),
      prisma.dictionary.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          level: true,
          version: true,
          isDefault: true,
          _count: { select: { words: true } }
        }
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { activeDictionaryId: true }
      })
    ]);
    const localBySlug = new Map(localDictionaries.map((dictionary) => [dictionary.slug, dictionary]));

    return NextResponse.json({
      ok: true,
      activeDictionaryId: freshUser?.activeDictionaryId ?? null,
      catalog: catalog.map((item) => {
        const local = localBySlug.get(item.slug);

        return {
          ...item,
          localDictionaryId: local?.id ?? null,
          localVersion: local?.version ?? null,
          localWordsCount: local?._count.words ?? 0,
          isDownloaded: Boolean(local),
          hasUpdate: Boolean(local && local.version < item.version),
          isActive: Boolean(local && local.id === freshUser?.activeDictionaryId)
        };
      })
    });
  } catch {
    return apiError("Failed to load dictionary catalog");
  }
}
