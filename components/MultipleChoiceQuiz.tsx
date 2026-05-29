"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, XCircle } from "lucide-react";

import { Button } from "@/components/Button";
import { TrainingCard } from "@/components/TrainingCard";
import type { WordView } from "@/lib/wordSerializer";
import { cn } from "@/utils/cn";
import type { HintVisibility } from "@/utils/hintLadder";
import { saveReview } from "@/utils/reviewClient";
import { buildMultipleChoiceOptions } from "@/utils/trainingQueue";

type MultipleChoiceQuizProps = {
  word: WordView;
  words: WordView[];
  visibility: HintVisibility;
  answerField?: "english" | "translation";
  title?: string;
  onNext?: () => void;
  onReviewed?: (word: WordView) => void;
};

export function MultipleChoiceQuiz({ word, words, visibility, answerField = "english", title = "Multiple Choice", onNext, onReviewed }: MultipleChoiceQuizProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"correct" | "wrong" | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [busy, setBusy] = useState(false);

  const correctAnswer = answerField === "english" ? word.english : word.translation;
  const options = useMemo(
    () => buildMultipleChoiceOptions(correctAnswer, words.map((item) => (answerField === "english" ? item.english : item.translation))),
    [answerField, correctAnswer, words]
  );

  useEffect(() => {
    setSelected(null);
    setStatus(null);
    setShowAnswer(false);
    setBusy(false);
  }, [word.id, answerField]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key >= "1" && event.key <= "4" && !status) {
        const option = options[Number(event.key) - 1];
        if (option) {
          void handleSelect(option);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  async function handleSelect(option: string) {
    if (busy || status) {
      return;
    }

    const nextStatus = option.trim().toLowerCase() === correctAnswer.trim().toLowerCase() ? "correct" : "wrong";
    setBusy(true);
    setSelected(option);
    setStatus(nextStatus);

    try {
      const updatedWord = await saveReview(word.id, nextStatus);
      onReviewed?.(updatedWord);
    } finally {
      setBusy(false);
    }
  }

  async function quickReview(result: "correct" | "wrong") {
    setBusy(true);
    setStatus(result);
    setShowAnswer(true);
    try {
      const updatedWord = await saveReview(word.id, result);
      onReviewed?.(updatedWord);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <TrainingCard word={word} visibility={visibility} title={title} />

      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Вопрос</p>
            <h3 className="mt-1 text-xl font-semibold text-white">{answerField === "english" ? "Выберите английское слово" : "Выберите перевод"}</h3>
          </div>
          <Button type="button" variant="ghost" icon={<Eye className="h-4 w-4" />} onClick={() => setShowAnswer(true)}>
            Показать ответ
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option, index) => {
            const isCorrect = option === correctAnswer;
            const isSelected = option === selected;
            const reveal = Boolean(status) || showAnswer;

            return (
              <button
                key={`${option}-${index}`}
                type="button"
                disabled={Boolean(status) || busy}
                className={cn(
                  "focus-ring min-h-14 rounded-lg border px-4 py-3 text-left text-sm font-medium transition",
                  "border-white/10 bg-graphite-900 text-slate-100 hover:border-sky-300/50 hover:bg-white/[0.06]",
                  reveal && isCorrect && "border-emerald-300/50 bg-emerald-500/15 text-emerald-100",
                  reveal && isSelected && !isCorrect && "border-red-300/50 bg-red-500/15 text-red-100"
                )}
                onClick={() => void handleSelect(option)}
              >
                <span className="mr-3 text-slate-500">{index + 1}</span>
                {option}
              </button>
            );
          })}
        </div>

        {status ? (
          <div
            className={cn(
              "mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
              status === "correct" ? "border-emerald-300/20 bg-emerald-500/15 text-emerald-100" : "border-red-300/20 bg-red-500/15 text-red-100"
            )}
          >
            {status === "correct" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {status === "correct" ? "Правильно!" : `Неправильно. Правильный ответ: ${correctAnswer}`}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="success" onClick={() => void quickReview("correct")} disabled={busy || Boolean(status)}>
            Я вспомнил
          </Button>
          <Button type="button" variant="danger" onClick={() => void quickReview("wrong")} disabled={busy || Boolean(status)}>
            Не вспомнил
          </Button>
          <Button type="button" variant="primary" onClick={onNext}>
            Следующее слово
          </Button>
        </div>
      </section>
    </div>
  );
}
