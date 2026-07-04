import type { DailyContent as DailyContentRecord } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type SubtitlesStatus = "confirmed" | "likely" | "unknown";

export type DailyVideo = {
  title: string;
  url: string;
  source: string;
  thumbnail?: string;
  youtubeEmbedUrl?: string;
  hasEnglishSubtitles: boolean;
  subtitlesStatus: SubtitlesStatus;
};

export type DailyContentView = {
  id?: string;
  title: string;
  paragraphEn: string;
  paragraphRu: string;
  source: string;
  date?: string;
  isManual: boolean;
  videoTitle: string;
  videoSource: string;
  videoUrl: string;
  videoThumbnail?: string;
  youtubeEmbedUrl: string;
  subtitlesStatus: SubtitlesStatus;
};

export const fallbackDailyContent: DailyContentView = {
  title: "Curiosity and language",
  paragraphEn:
    "When you learn a new word, you are not only memorizing a translation. You are adding a small tool for noticing the world more precisely. A richer vocabulary helps you ask better questions, explain your ideas, and understand people whose experience is different from yours.",
  paragraphRu:
    "Когда ты учишь новое слово, ты запоминаешь не только перевод. Ты добавляешь маленький инструмент, который помогает точнее замечать мир. Более богатый словарь помогает задавать лучшие вопросы, объяснять свои идеи и понимать людей с другим опытом.",
  source: "Fallback learning note for Word Memory Trainer",
  isManual: false,
  videoTitle: "4 reasons to learn a new language - John McWhorter",
  videoSource: "TED-Ed",
  videoUrl: "https://www.youtube.com/watch?v=VQRjouwKDlU",
  youtubeEmbedUrl: "https://www.youtube.com/embed/VQRjouwKDlU",
  subtitlesStatus: "confirmed"
};

const gutenbergAliceUrl = "https://www.gutenberg.org/cache/epub/11/pg11.txt";

const youtubeFeeds = [
  {
    title: "TED-Ed",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCsooa4yRKGN_zEE8iknghZA",
    subtitlesStatus: "likely" as const
  },
  {
    title: "BBC Learning English",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCHaHD477h-FeBbVh9Sh7syA",
    subtitlesStatus: "likely" as const
  }
];

function videoIdFromUrl(url: string) {
  return url.match(/[?&]v=([^&]+)/)?.[1] ?? url.match(/youtu\.be\/([^?]+)/)?.[1] ?? null;
}

function embedUrlFromVideoUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  const videoId = videoIdFromUrl(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

async function fetchText(url: string, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 6 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeParagraph(paragraph: string) {
  return paragraph.replace(/\s+/g, " ").trim();
}

function pickGutenbergParagraph(text: string) {
  const firstAliceParagraph = "Alice was beginning to get very tired";
  const aliceStart = text.indexOf(firstAliceParagraph);

  if (aliceStart >= 0) {
    return normalizeParagraph(text.slice(aliceStart).split(/\n\s*\n/)[0]);
  }

  const bookStartMarker = "*** START OF THE PROJECT GUTENBERG EBOOK";
  const bookStart = text.indexOf(bookStartMarker);
  const content = bookStart >= 0 ? text.slice(bookStart) : text;
  const paragraphs = content
    .split(/\n\s*\n/)
    .map(normalizeParagraph)
    .filter((paragraph) => {
      return (
        paragraph.length >= 180 &&
        paragraph.length <= 520 &&
        /Alice|Rabbit|thought|said|looked/i.test(paragraph) &&
        !/^CHAPTER\b/i.test(paragraph) &&
        !/CHAPTER [IVX]+\./i.test(paragraph)
      );
    });

  return paragraphs[0] ?? fallbackDailyContent.paragraphEn;
}

function translateKnownParagraph(paragraph: string) {
  if (paragraph.startsWith("Alice was beginning to get very tired")) {
    return "Алисе начинало очень надоедать сидеть рядом с сестрой на берегу без всякого дела. Раз или два она заглянула в книгу, которую читала сестра, но в ней не было ни картинок, ни разговоров. «И что толку в книге, - подумала Алиса, - если в ней нет ни картинок, ни разговоров?»";
  }

  if (paragraph.includes("Alice")) {
    return "Алиса заметила что-то необычное и попыталась понять, что происходит. Этот фрагмент удобно читать как короткое упражнение: сначала английский текст, затем перевод и новые слова.";
  }

  return fallbackDailyContent.paragraphRu;
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function checkYouTubeSubtitles(videoId: string, fallbackStatus: SubtitlesStatus): Promise<SubtitlesStatus> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (!apiKey) {
    return fallbackStatus;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${encodeURIComponent(
        videoId
      )}&key=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: 60 * 60 * 12 } }
    );

    if (!response.ok) {
      return fallbackStatus;
    }

    const data = (await response.json()) as { items?: Array<{ snippet?: { language?: string } }> };
    return data.items?.some((item) => item.snippet?.language?.toLowerCase().startsWith("en"))
      ? "confirmed"
      : fallbackStatus;
  } catch {
    return fallbackStatus;
  }
}

async function parseYoutubeVideo(): Promise<DailyVideo> {
  const feed = youtubeFeeds[Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % youtubeFeeds.length];
  const xml = await fetchText(feed.url);
  const videoId = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
  const title = decodeXml(xml.match(/<media:title>([^<]+)<\/media:title>/)?.[1] ?? feed.title);
  const thumbnail = decodeXml(xml.match(/<media:thumbnail url="([^"]+)"/)?.[1] ?? "");

  if (!videoId) {
    throw new Error("YouTube feed did not contain a video id");
  }

  const subtitlesStatus = await checkYouTubeSubtitles(videoId, feed.subtitlesStatus);

  if (subtitlesStatus === "unknown") {
    throw new Error("Video subtitles are not confirmed or likely");
  }

  return {
    title,
    source: feed.title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnail: thumbnail || undefined,
    youtubeEmbedUrl: `https://www.youtube.com/embed/${videoId}`,
    hasEnglishSubtitles: subtitlesStatus === "confirmed" || subtitlesStatus === "likely",
    subtitlesStatus
  };
}

function serializeDailyRecord(record: DailyContentRecord): DailyContentView {
  return {
    id: record.id,
    title: record.title,
    paragraphEn: record.englishText,
    paragraphRu: record.russianTranslation,
    source: record.textSource,
    date: record.date.toISOString(),
    isManual: true,
    videoTitle: record.videoTitle ?? fallbackDailyContent.videoTitle,
    videoSource: record.videoSource ?? fallbackDailyContent.videoSource,
    videoUrl: record.videoUrl ?? fallbackDailyContent.videoUrl,
    videoThumbnail: record.videoThumbnail ?? undefined,
    youtubeEmbedUrl: record.youtubeEmbedUrl || embedUrlFromVideoUrl(record.videoUrl) || fallbackDailyContent.youtubeEmbedUrl,
    subtitlesStatus:
      record.subtitlesStatus === "confirmed" || record.subtitlesStatus === "likely" ? record.subtitlesStatus : "unknown"
  };
}

async function getManualDailyContent(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const today = await prisma.dailyContent.findFirst({
    where: {
      isActive: true,
      date: { gte: start, lt: end }
    },
    orderBy: { updatedAt: "desc" }
  });

  if (today) {
    return serializeDailyRecord(today);
  }

  const latest = await prisma.dailyContent.findFirst({
    where: { isActive: true },
    orderBy: [{ date: "desc" }, { updatedAt: "desc" }]
  });

  return latest ? serializeDailyRecord(latest) : null;
}

export async function getParsedDailyContent(): Promise<DailyContentView> {
  try {
    const [aliceText, video] = await Promise.all([fetchText(gutenbergAliceUrl), parseYoutubeVideo()]);
    const paragraphEn = pickGutenbergParagraph(aliceText);

    return {
      title: "Alice's Adventures in Wonderland",
      paragraphEn,
      paragraphRu: translateKnownParagraph(paragraphEn),
      source: "Project Gutenberg: Alice's Adventures in Wonderland by Lewis Carroll",
      isManual: false,
      videoTitle: video.title,
      videoSource: video.source,
      videoUrl: video.url,
      videoThumbnail: video.thumbnail,
      youtubeEmbedUrl: video.youtubeEmbedUrl ?? embedUrlFromVideoUrl(video.url),
      subtitlesStatus: video.subtitlesStatus
    };
  } catch {
    return fallbackDailyContent;
  }
}

export async function getDailyContent(options: { ignoreDatabase?: boolean } = {}) {
  if (!options.ignoreDatabase) {
    const manual = await getManualDailyContent();

    if (manual) {
      return manual;
    }
  }

  return getParsedDailyContent();
}
