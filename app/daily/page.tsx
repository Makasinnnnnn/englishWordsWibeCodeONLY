import Link from "next/link";
import { ExternalLink, GalleryHorizontal } from "lucide-react";

import { Button } from "@/components/Button";
import { requireUser } from "@/lib/auth";
import { getDailyContent } from "@/lib/dailyContent";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  await requireUser();
  const dailyContent = await getDailyContent();
  const subtitlesLabel =
    dailyContent.subtitlesStatus === "confirmed"
      ? "Английские субтитры подтверждены"
      : dailyContent.subtitlesStatus === "likely"
        ? "Субтитры вероятно доступны"
        : "Субтитры не подтверждены";

  return (
    <div className="space-y-5">
      <section className="panel p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-200/80">Контент дня</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{dailyContent.title}</h2>
            <p className="mt-2 text-sm text-slate-500">
              Источник: {dailyContent.source} · {dailyContent.isManual ? "ручное управление" : "автоматический подбор"}
            </p>
          </div>
          <Link href="/cards">
            <Button variant="secondary" icon={<GalleryHorizontal className="h-4 w-4" />}>
              К карточкам
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <article className="panel p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">English paragraph</p>
          <p className="mt-3 text-lg leading-8 text-white">{dailyContent.paragraphEn}</p>
          <div className="mt-5 rounded-lg border border-sky-300/15 bg-sky-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-sky-100/80">Перевод</p>
            <p className="mt-2 text-base leading-7 text-sky-50">{dailyContent.paragraphRu}</p>
          </div>
        </article>

        <aside className="panel overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Видео на английском</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{dailyContent.videoTitle}</h3>
            <p className="mt-2 text-sm text-slate-500">
              Источник: {dailyContent.videoSource} · {subtitlesLabel}
            </p>
          </div>
          <div className="aspect-video bg-black">
            <iframe
              src={dailyContent.youtubeEmbedUrl}
              title={dailyContent.videoTitle}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className="p-5">
            <a href={dailyContent.videoUrl} target="_blank" rel="noreferrer">
              <Button variant="secondary" icon={<ExternalLink className="h-4 w-4" />}>
                Открыть источник
              </Button>
            </a>
          </div>
        </aside>
      </section>
    </div>
  );
}
