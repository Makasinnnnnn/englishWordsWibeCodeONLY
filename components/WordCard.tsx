"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Dumbbell, Edit3, Flame, ImageIcon, Trash2 } from "lucide-react";

import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { useToast } from "@/components/Toast";
import type { WordView } from "@/lib/wordSerializer";
import { cn } from "@/utils/cn";

type WordCardProps = {
  word: WordView;
  detail?: boolean;
  afterDeleteHref?: string;
};

function formatDate(date: string | null) {
  if (!date) {
    return "не повторялось";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));
}

export function WordCard({ word, detail = false, afterDeleteHref = "/words" }: WordCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [imageBroken, setImageBroken] = useState(false);
  const [busy, setBusy] = useState(false);

  async function deleteWord() {
    if (!window.confirm(`Удалить слово "${word.english}"?`)) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/words/${word.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Delete failed");
      }
      showToast("Слово удалено", "success");
      router.push(afterDeleteHref);
      router.refresh();
    } catch {
      showToast("Не удалось удалить слово", "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleLearned() {
    const nextIsLearned = !word.isLearned;
    setBusy(true);
    try {
      const response = await fetch(`/api/words/${word.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isLearned: nextIsLearned,
          learningLevel: nextIsLearned ? 5 : Math.min(word.learningLevel, 4)
        })
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      showToast(nextIsLearned ? "Слово отмечено как выученное" : "Слово возвращено в обучение", "success");
      router.refresh();
    } catch {
      showToast("Не удалось обновить слово", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={cn("panel overflow-hidden", detail ? "grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]" : "")}>
      <div className={cn("space-y-5 p-5", detail && "md:p-6")}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn("truncate font-semibold text-white", detail ? "text-4xl" : "text-2xl")}>{word.english}</h2>
              {word.isLearned ? (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">выучено</span>
              ) : (
                <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-xs text-sky-200">уровень {word.learningLevel}</span>
              )}
            </div>
            <p className="mt-2 text-lg text-slate-300">{word.translation}</p>
          </div>
          <span className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs uppercase text-slate-400">{word.difficulty}</span>
        </div>

        {!detail ? (
          word.imageUrl && !imageBroken ? (
            <div className="overflow-hidden rounded-lg border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={word.imageUrl} alt={word.english} className="aspect-[16/7] w-full object-cover" onError={() => setImageBroken(true)} />
            </div>
          ) : (
            <div className="flex aspect-[16/7] items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.04] text-sm text-slate-500">
              <ImageIcon className="mr-2 h-4 w-4" />
              Картинка не добавлена
            </div>
          )
        ) : null}

        <ProgressBar value={word.learningLevel} max={5} label="Прогресс изучения" tone={word.isLearned ? "emerald" : "sky"} />

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="muted-panel p-3">
            <dt className="text-slate-500">Ассоциация</dt>
            <dd className="mt-1 text-slate-200">{word.association || "не добавлена"}</dd>
          </div>
          <div className="muted-panel p-3">
            <dt className="text-slate-500">Последнее повторение</dt>
            <dd className="mt-1 text-slate-200">{formatDate(word.lastReviewedAt)}</dd>
          </div>
          <div className="muted-panel p-3">
            <dt className="text-slate-500">Правильно</dt>
            <dd className="mt-1 text-emerald-200">{word.correctCount}</dd>
          </div>
          <div className="muted-panel p-3">
            <dt className="text-slate-500">Ошибки / опечатки</dt>
            <dd className="mt-1 text-amber-200">
              {word.wrongCount} / {word.typoCount}
            </dd>
          </div>
          <div className="muted-panel p-3">
            <dt className="text-slate-500">Повторов / серия</dt>
            <dd className="mt-1 text-slate-200">
              {word.reviewCount} / {word.streak}
            </dd>
          </div>
          <div className="muted-panel p-3">
            <dt className="text-slate-500">Следующее повторение</dt>
            <dd className="mt-1 text-slate-200">{formatDate(word.nextReviewAt)}</dd>
          </div>
        </dl>

        {detail && word.notes ? (
          <div className="muted-panel p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Notes</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{word.notes}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link href={`/training/${word.id}`}>
            <Button variant="primary" icon={<Dumbbell className="h-4 w-4" />}>
              Тренировать
            </Button>
          </Link>
          <Link href={`/words/${word.id}/edit`}>
            <Button variant="secondary" icon={<Edit3 className="h-4 w-4" />}>
              Редактировать
            </Button>
          </Link>
          <Button type="button" variant={word.isLearned ? "warning" : "success"} icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => void toggleLearned()} disabled={busy}>
            {word.isLearned ? "Вернуть в обучение" : "Выучено"}
          </Button>
          <Button type="button" variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => void deleteWord()} disabled={busy}>
            Удалить
          </Button>
        </div>
      </div>

      <div className={cn("border-t border-white/10 bg-white/[0.025] p-5 lg:border-l lg:border-t-0", !detail && "hidden")}>
        {word.imageUrl && !imageBroken ? (
          <div className="overflow-hidden rounded-lg border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={word.imageUrl} alt={word.english} className="aspect-[16/12] w-full object-cover" onError={() => setImageBroken(true)} />
          </div>
        ) : (
          <div className="flex aspect-[16/12] items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.04] text-slate-500">
            <ImageIcon className="mr-2 h-5 w-5" />
            Картинка не добавлена
          </div>
        )}

        <div className="mt-5 rounded-lg border border-white/10 bg-graphite-900 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Flame className="h-4 w-4 text-amber-300" />
            Тренировочная связка
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {word.translation} {"->"} {word.association || "ассоциация"} {"->"} {word.english}
          </p>
        </div>
      </div>
    </article>
  );
}
