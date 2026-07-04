"use client";

import { useEffect, useMemo, useState, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, Loader2, MessageSquareText, RotateCcw, XCircle } from "lucide-react";

import { Button } from "@/components/Button";
import type { CardQueueItemView } from "@/lib/cards/serializer";
import { cardReviewIntervals, totalCardReviewStages } from "@/lib/cards/scheduler";
import { cn } from "@/utils/cn";

type SwipeAction = "known" | "unknown" | "remembered" | "forgot";

type SwipeWordCardProps = {
  item: CardQueueItemView;
  busy?: boolean;
  onAction: (action: SwipeAction) => void;
};

const swipeThreshold = 96;
const interactiveSelector = "button,a,input,select,textarea,label,[role='button']";

type CardExampleState = {
  en: string;
  ru?: string;
  source?: string;
  provider?: string;
};

function formatStage(stage: number) {
  if (stage >= totalCardReviewStages) {
    return "финал";
  }

  return `${stage + 1}/${totalCardReviewStages} · ${cardReviewIntervals[Math.min(stage, totalCardReviewStages - 1)].label}`;
}

export function SwipeWordCard({ item, busy = false, onAction }: SwipeWordCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [example, setExample] = useState<CardExampleState | null>(null);
  const [exampleLoading, setExampleLoading] = useState(false);
  const [exampleError, setExampleError] = useState<string | null>(null);

  useEffect(() => {
    setRevealed(false);
    setDragStartX(null);
    setDragX(0);
    setExample(item.word.exampleEn ? { en: item.word.exampleEn, ru: item.word.exampleRu ?? undefined } : null);
    setExampleLoading(false);
    setExampleError(null);
  }, [item.word.id, item.word.exampleEn, item.word.exampleRu, item.cardType, item.direction]);

  const actions = useMemo(() => {
    if (item.cardType === "new") {
      return {
        left: { id: "unknown" as const, label: "Я не знал этого слова", icon: XCircle },
        right: { id: "known" as const, label: "Я уже знаю это слово", icon: CheckCircle2 }
      };
    }

    const rememberedLabel =
      item.progress?.lapseStep === 1
        ? "Я запомнил · дальше через 1 час"
        : item.progress?.lapseStep === 2
          ? "Я запомнил · вернуться к этапам"
          : "Я запомнил это слово";

    return {
      left: { id: "forgot" as const, label: "Не запомнил · повтор через 5 минут", icon: RotateCcw },
      right: { id: "remembered" as const, label: rememberedLabel, icon: CheckCircle2 }
    };
  }, [item.cardType, item.progress?.lapseStep]);

  const leftActive = dragX < -swipeThreshold / 2;
  const rightActive = dragX > swipeThreshold / 2;
  const rotation = Math.max(-9, Math.min(9, dragX / 18));
  const LeftIcon = actions.left.icon;
  const RightIcon = actions.right.icon;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (busy) {
      return;
    }

    if ((event.target as HTMLElement).closest(interactiveSelector)) {
      return;
    }

    setDragStartX(event.clientX);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStartX === null || busy) {
      return;
    }

    setDragX(event.clientX - dragStartX);
  }

  function onPointerUp() {
    if (busy) {
      return;
    }

    if (dragX <= -swipeThreshold) {
      onAction(actions.left.id);
      return;
    }

    if (dragX >= swipeThreshold) {
      onAction(actions.right.id);
      return;
    }

    setDragStartX(null);
    setDragX(0);
  }

  async function loadExample() {
    if (exampleLoading) {
      return;
    }

    setExampleLoading(true);
    setExampleError(null);

    try {
      const response = await fetch("/api/cards/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wordId: item.word.id,
          word: item.word.english,
          context: item.word.exampleEn ?? undefined,
          sourceLang: "en",
          targetLang: "ru"
        })
      });
      const data = (await response.json()) as {
        translation?: string | null;
        examples?: Array<{ en: string; ru?: string; source?: string }>;
        provider?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Пример пока недоступен");
      }

      const nextExample = data.examples?.[0];
      if (!nextExample) {
        throw new Error("Пример пока недоступен");
      }

      setExample({ ...nextExample, provider: data.provider });
    } catch (error) {
      setExampleError(error instanceof Error ? error.message : "Пример пока недоступен");
    } finally {
      setExampleLoading(false);
    }
  }

  const primaryText = item.cardType === "new" || item.direction === "en-ru" ? item.word.english : item.word.translation;
  const primaryLabel = item.cardType === "new" || item.direction === "en-ru" ? "English" : "Русский перевод";
  const hiddenText = item.cardType === "new" || item.direction === "en-ru" ? item.word.translation : item.word.english;
  const hiddenLabel = item.cardType === "new" || item.direction === "en-ru" ? "Перевод" : "English";

  return (
    <div className="mx-auto w-full max-w-xl touch-pan-y select-none">
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-medium">
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-center transition",
            leftActive
              ? "border-red-300/40 bg-red-500/20 text-red-100"
              : "border-white/10 bg-white/[0.035] text-slate-500"
          )}
        >
          <ArrowLeft className="mx-auto mb-1 h-4 w-4" />
          {actions.left.label}
        </div>
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-center transition",
            rightActive
              ? "border-emerald-300/40 bg-emerald-500/20 text-emerald-100"
              : "border-white/10 bg-white/[0.035] text-slate-500"
          )}
        >
          <ArrowRight className="mx-auto mb-1 h-4 w-4" />
          {actions.right.label}
        </div>
      </div>

      <article
        className="panel cursor-grab overflow-hidden active:cursor-grabbing"
        style={{
          transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
          transition: dragStartX === null ? "transform 180ms ease" : "none"
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          setDragStartX(null);
          setDragX(0);
        }}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              {item.cardType === "new"
                ? "Новое слово"
                : item.direction === "en-ru"
                  ? "Ротация · English → Русский"
                  : "Ротация · Русский → English"}
            </p>
            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-xs text-sky-100">
              {item.cardType === "new" ? "new" : formatStage(item.progress?.reviewStage ?? 0)}
            </span>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{primaryLabel}</p>
            <h2 className="mt-2 break-words text-4xl font-semibold text-white sm:text-5xl">{primaryText}</h2>
            {(item.cardType === "new" || item.direction === "en-ru") && item.word.transcription ? (
              <p className="mt-2 text-lg text-sky-100/80">{item.word.transcription}</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{hiddenLabel}</p>
            {revealed ? (
              <div>
                <p className="mt-2 text-2xl font-semibold text-slate-50">{hiddenText}</p>
                {item.direction === "ru-en" && item.word.transcription ? (
                  <p className="mt-1 text-sm text-sky-100/75">{item.word.transcription}</p>
                ) : null}
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="mt-3 w-full"
                icon={<Eye className="h-5 w-5" />}
                onClick={() => setRevealed(true)}
              >
                Показать слово
              </Button>
            )}
          </div>

          {item.cardType === "rotation" ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Этапы повторения</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cardReviewIntervals.map((interval, index) => {
                  const active = index === (item.progress?.reviewStage ?? 0);
                  const passed = index < (item.progress?.reviewStage ?? 0);

                  return (
                    <span
                      key={`${interval.label}-${index}`}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs",
                        active && "border-sky-300/40 bg-sky-400/15 text-sky-100",
                        passed && "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
                        !active && !passed && "border-white/10 bg-white/[0.035] text-slate-500"
                      )}
                    >
                      {interval.label}
                    </span>
                  );
                })}
              </div>
              {item.progress?.lapseStep ? (
                <p className="mt-3 text-xs leading-5 text-amber-100">
                  Сейчас слово в коротком повторе после ошибки: сначала 5 минут, затем 1 час, потом возврат к следующему
                  этапу.
                </p>
              ) : null}
            </div>
          ) : null}

          {example ? (
            <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/80">Example</p>
              <p className="mt-2 text-sm leading-6 text-emerald-50">{example.en}</p>
              {example.ru ? (
                <p className="mt-2 text-sm leading-6 text-emerald-100/75">{example.ru}</p>
              ) : null}
              {example.source || example.provider ? (
                <p className="mt-2 text-xs text-emerald-100/60">
                  Источник: {example.source ?? example.provider}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Пример использования</p>
                  {exampleError ? <p className="mt-2 text-sm text-amber-100">{exampleError}</p> : null}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  icon={
                    exampleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquareText className="h-4 w-4" />
                    )
                  }
                  onClick={() => void loadExample()}
                  disabled={exampleLoading}
                >
                  {exampleLoading ? "Загружаю" : "Получить пример"}
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="danger"
              size="lg"
              className="min-h-14 whitespace-normal"
              icon={<LeftIcon className="h-5 w-5" />}
              onClick={() => onAction(actions.left.id)}
              disabled={busy}
            >
              {actions.left.label}
            </Button>
            <Button
              type="button"
              variant="success"
              size="lg"
              className="min-h-14 whitespace-normal"
              icon={<RightIcon className="h-5 w-5" />}
              onClick={() => onAction(actions.right.id)}
              disabled={busy}
            >
              {actions.right.label}
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
