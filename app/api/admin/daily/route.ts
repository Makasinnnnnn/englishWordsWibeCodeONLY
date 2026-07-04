import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { verifyAdminPassword } from "@/lib/admin";
import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { getParsedDailyContent } from "@/lib/dailyContent";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dailyAdminSchema = z.object({
  password: z.string().optional(),
  id: z.string().optional(),
  date: z.string().trim().min(1),
  title: z.string().trim().min(1),
  englishText: z.string().trim().min(1),
  russianTranslation: z.string().trim().min(1),
  textSource: z.string().trim().min(1),
  videoTitle: z.string().trim().optional(),
  videoUrl: z.string().trim().optional(),
  videoSource: z.string().trim().optional(),
  videoThumbnail: z.string().trim().optional(),
  youtubeEmbedUrl: z.string().trim().optional(),
  subtitlesStatus: z.enum(["confirmed", "likely", "unknown"]),
  isActive: z.boolean().default(true)
});

async function requireAdmin(request: NextRequest, bodyPassword?: string) {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  return verifyAdminPassword(bodyPassword ?? request.headers.get("x-admin-password"));
}

export async function GET(request: NextRequest) {
  try {
    const password = request.nextUrl.searchParams.get("password");

    if (!(await requireAdmin(request, password ?? undefined))) {
      return apiError("Admin password required", { status: 401, code: "ADMIN_REQUIRED" });
    }

    const parsed = await getParsedDailyContent();

    return NextResponse.json({ ok: true, content: parsed });
  } catch {
    return apiError("Failed to generate daily content");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = dailyAdminSchema.parse(await request.json());

    if (!(await requireAdmin(request, payload.password))) {
      return apiError("Admin password required", { status: 401, code: "ADMIN_REQUIRED" });
    }

    const date = new Date(payload.date);

    if (Number.isNaN(date.getTime())) {
      return apiError("Invalid publication date", { status: 400, code: "INVALID_DATE" });
    }

    const content = await prisma.dailyContent.upsert({
      where: { id: payload.id ?? "__new_daily_content__" },
      create: {
        date,
        title: payload.title,
        englishText: payload.englishText,
        russianTranslation: payload.russianTranslation,
        textSource: payload.textSource,
        videoTitle: payload.videoTitle,
        videoUrl: payload.videoUrl,
        videoSource: payload.videoSource,
        videoThumbnail: payload.videoThumbnail,
        youtubeEmbedUrl: payload.youtubeEmbedUrl,
        subtitlesStatus: payload.subtitlesStatus,
        isActive: payload.isActive
      },
      update: {
        date,
        title: payload.title,
        englishText: payload.englishText,
        russianTranslation: payload.russianTranslation,
        textSource: payload.textSource,
        videoTitle: payload.videoTitle,
        videoUrl: payload.videoUrl,
        videoSource: payload.videoSource,
        videoThumbnail: payload.videoThumbnail,
        youtubeEmbedUrl: payload.youtubeEmbedUrl,
        subtitlesStatus: payload.subtitlesStatus,
        isActive: payload.isActive
      }
    });

    return NextResponse.json({ ok: true, content });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to save daily content");
  }
}
