import { NextRequest, NextResponse } from "next/server";

import { apiError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { parseWordsCsv } from "@/lib/import-export/csv";
import { prisma } from "@/lib/prisma";
import { normalizeEnglishWord } from "@/lib/wordLogic";

export const dynamic = "force-dynamic";

const maxCsvSizeBytes = 500_000;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Authentication required", { status: 401, code: "UNAUTHORIZED" });
    }

    const csv = await request.text();

    if (new TextEncoder().encode(csv).length > maxCsvSizeBytes) {
      return apiError("CSV file is too large", { status: 413, code: "FILE_TOO_LARGE" });
    }

    const parsed = parseWordsCsv(csv);

    if (parsed.errors.length > 0 && parsed.words.length === 0) {
      return apiError("CSV import failed", {
        status: 400,
        code: "VALIDATION_ERROR",
        issues: parsed.errors
      });
    }

    let created = 0;
    let skipped = 0;

    for (const word of parsed.words) {
      const englishNormalized = normalizeEnglishWord(word.english);
      const existing = await prisma.word.findUnique({
        where: {
          userId_englishNormalized: {
            userId: user.id,
            englishNormalized
          }
        },
        select: { id: true }
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      await prisma.word.create({
        data: {
          ...word,
          userId: user.id,
          englishNormalized
        }
      });
      created += 1;
    }

    return NextResponse.json({
      ok: true,
      data: {
        created,
        skipped,
        errors: parsed.errors
      }
    });
  } catch {
    return apiError("Failed to import words");
  }
}
