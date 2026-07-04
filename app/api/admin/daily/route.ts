import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { verifyAdminCredentials } from "@/lib/admin";
import { apiError, validationError } from "@/lib/apiResponse";
import { getCurrentUser } from "@/lib/auth";
import { getParsedDailyContent } from "@/lib/dailyContent";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);
const optionalUrl = optionalString.refine((value) => !value || isValidUrl(value), "Invalid URL");
const optionalYouTubeUrl = optionalString.refine(
  (value) => !value || getYouTubeEmbedUrl(value),
  "Only YouTube URLs are supported"
);

const dailyAdminSchema = z.object({
  login: z.string().optional(),
  password: z.string().optional(),
  id: z.string().optional(),
  date: z.string().trim().min(1),
  title: z.string().trim().min(1),
  englishText: z.string().trim().min(1),
  russianTranslation: z.string().trim().min(1),
  textSource: z.string().trim().min(1),
  videoTitle: optionalString,
  videoUrl: optionalYouTubeUrl,
  videoSource: optionalString,
  videoThumbnail: optionalUrl,
  youtubeEmbedUrl: optionalYouTubeUrl,
  subtitlesStatus: z.enum(["confirmed", "likely", "unknown"]),
  isActive: z.boolean().default(true)
});

const deleteDailySchema = z.object({
  login: z.string().optional(),
  password: z.string().optional(),
  id: z.string().min(1),
  mode: z.enum(["archive", "delete"]).default("archive")
});

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function getYouTubeVideoId(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (!host.endsWith("youtube.com")) {
      return null;
    }

    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/").filter(Boolean)[1] ?? null;
    }

    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }

    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/").filter(Boolean)[1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

function getYouTubeEmbedUrl(value?: string | null) {
  const videoId = getYouTubeVideoId(value);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

async function requireAdmin(request: NextRequest, bodyLogin?: string, bodyPassword?: string) {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  return verifyAdminCredentials(
    bodyLogin ?? request.headers.get("x-admin-login"),
    bodyPassword ?? request.headers.get("x-admin-password")
  );
}

export async function GET(request: NextRequest) {
  try {
    const password = request.nextUrl.searchParams.get("password");
    const login = request.nextUrl.searchParams.get("login");
    const mode = request.nextUrl.searchParams.get("mode");

    if (!(await requireAdmin(request, login ?? undefined, password ?? undefined))) {
      return apiError("Admin password required", { status: 401, code: "ADMIN_REQUIRED" });
    }

    if (mode === "generate") {
      const parsed = await getParsedDailyContent();

      return NextResponse.json({ ok: true, content: parsed });
    }

    const records = await prisma.dailyContent.findMany({
      orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
      take: 30
    });

    return NextResponse.json({ ok: true, records });
  } catch {
    return apiError("Failed to load daily content");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = dailyAdminSchema.parse(await request.json());

    if (!(await requireAdmin(request, payload.login, payload.password))) {
      return apiError("Admin password required", { status: 401, code: "ADMIN_REQUIRED" });
    }

    const date = new Date(payload.date);
    const youtubeEmbedUrl = payload.youtubeEmbedUrl ?? getYouTubeEmbedUrl(payload.videoUrl);

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
        youtubeEmbedUrl,
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
        youtubeEmbedUrl,
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

export async function DELETE(request: NextRequest) {
  try {
    const payload = deleteDailySchema.parse(await request.json());

    if (!(await requireAdmin(request, payload.login, payload.password))) {
      return apiError("Admin password required", { status: 401, code: "ADMIN_REQUIRED" });
    }

    if (payload.mode === "delete") {
      await prisma.dailyContent.delete({ where: { id: payload.id } });
    } else {
      await prisma.dailyContent.update({
        where: { id: payload.id },
        data: { isActive: false }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return apiError("Failed to update daily content");
  }
}
