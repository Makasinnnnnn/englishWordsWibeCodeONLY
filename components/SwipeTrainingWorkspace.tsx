"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarClock, CheckCircle2, RotateCcw, Trophy } from "lucide-react";

import { Button } from "@/components/Button";
import { SwipeWordCard } from "@/components/SwipeWordCard";
import type { CardDeckView, CardProgressView, CardQueueItemView } from "@/lib/cards/serializer";

type SwipeAction = "known" | "unknown" | "remembered" | "forgot";

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof BookOpen }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-sky-100" />
      </div>
    </div>
  );
}

function nextStats(
  stats: CardDeckView["stats"],
  action: SwipeAction,
  previous: CardQueueItemView,
  progress: CardProgressView
) {
  const next = { ...stats };

  if (action === "known") {
    next.known += previous.progress?.status === "known" ? 0 : 1;
    next.left = Math.max(0, next.left - 1);
  }

  if (action === "unknown" && !previous.progress) {
    next.rotation += 1;
  }

  if (previous.progress?.status === "rotation" && progress.status === "learned") {
    next.rotation = Math.max(0, next.rotation - 1);
    next.learned += 1;
    next.left = Math.max(0, next.left - 1);
  }

  next.due = Math.max(0, next.due - (previous.cardType === "rotation" ? 1 : 0));
  return next;
}

export function SwipeTrainingWorkspace({
  deck,
  includeLearnedOnce
}: {
  deck: CardDeckView;
  includeLearnedOnce: boolean;
}) {
  const router = useRouter();
  const [queue, setQueue] = useState(deck.queue);
  const [stats, setStats] = useState(deck.stats);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const current = queue[0];
  const activeSetParam = deck.cardSet ? `set=${deck.cardSet.id}` : "";
  const learnedHref = includeLearnedOnce
    ? `/cards${activeSetParam ? `?${activeSetParam}` : ""}`
    : `/cards?${[activeSetParam, "learned=1"].filter(Boolean).join("&")}`;

  const progressPercent = useMemo(() => {
    return stats.total > 0 ? Math.round(((stats.learned + stats.known) / stats.total) * 100) : 0;
  }, [stats.known, stats.learned, stats.total]);

  async function handleAction(action: SwipeAction) {
    if (!current || busy) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cards/${current.word.id}/swipe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = (await response.json()) as { progress?: CardProgressView; error?: string };

      if (!response.ok || !data.progress) {
        throw new Error(data.error ?? "Не удалось сохранить свайп");
      }

      setStats((value) => nextStats(value, action, current, data.progress as CardProgressView));
      setQueue((items) => items.slice(1));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить действие");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-200/80">Свайп-карточки</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{deck.cardSet?.title ?? deck.dictionary.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Карточки идут по очереди: сначала слова, срок повторения которых наступил, потом новые слова из
              B2-словаря.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={learnedHref}>
              <Button
                type="button"
                variant={includeLearnedOnce ? "warning" : "secondary"}
                icon={<RotateCcw className="h-4 w-4" />}
              >
                {includeLearnedOnce ? "Выключить выученные" : "Повторить выученные"}
              </Button>
            </Link>
            {deck.cardSet ? (
              <Link href="/cards?all=1">
                <Button type="button" variant="secondary">
                  Весь пул
                </Button>
              </Link>
            ) : null}
            <Link href="/cards/dictionary">
              <Button type="button" variant="secondary" icon={<BookOpen className="h-4 w-4" />}>
                Словарь карточек
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Всего" value={stats.total} icon={BookOpen} />
          <Metric label="Выучено" value={stats.learned} icon={Trophy} />
          <Metric label="В ротации" value={stats.rotation} icon={CalendarClock} />
          <Metric label="Уже знал" value={stats.known} icon={CheckCircle2} />
          <Metric label="Осталось" value={stats.left} icon={RotateCcw} />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>Прогресс словаря</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-lg border border-red-400/20 bg-red-500/15 px-4 py-3 text-sm text-red-100">
          {message}
        </div>
      ) : null}

      {current ? (
        <SwipeWordCard item={current} busy={busy} onAction={(action) => void handleAction(action)} />
      ) : (
        <section className="panel flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/80">Очередь пустая</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">На сейчас карточек нет</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            Если в ротации есть будущие повторы, они появятся здесь после наступления срока. Новые слова тоже
            закончатся, когда весь словарь будет разобран.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" variant="primary" onClick={() => router.refresh()}>
              Обновить очередь
            </Button>
            <Link href="/cards/dictionary">
              <Button type="button" variant="secondary">
                Открыть словарь карточек
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
