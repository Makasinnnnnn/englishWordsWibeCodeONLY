"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Eye, Keyboard, TriangleAlert, XCircle } from "lucide-react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { TrainingCard } from "@/components/TrainingCard";
import type { WordView } from "@/lib/wordSerializer";
import { checkAnswer, type AnswerStatus, type CheckAnswerResult } from "@/utils/checkAnswer";
import { cn } from "@/utils/cn";
import type { HintVisibility } from "@/utils/hintLadder";
import { saveReview } from "@/utils/reviewClient";

type ManualInputQuizProps = {
  word: WordView;
  visibility: HintVisibility;
  correctAnswer?: string;
  title?: string;
  question?: string;
  onNext?: () => void;
  onReviewed?: (word: WordView) => void;
};

const resultStyles: Record<AnswerStatus, string> = {
  correct: "border-emerald-300/20 bg-emerald-500/15 text-emerald-100",
  typo: "border-amber-300/20 bg-amber-500/15 text-amber-100",
  wrong: "border-red-300/20 bg-red-500/15 text-red-100"
};

const resultIcons = {
  correct: CheckCircle2,
  typo: TriangleAlert,
  wrong: XCircle
};

export function ManualInputQuiz({ word, visibility, correctAnswer = word.english, title = "Manual Input", question = "Введите английское слово", onNext, onReviewed }: ManualInputQuizProps) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<CheckAnswerResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAnswer("");
    setResult(null);
    setShowAnswer(false);
    setBusy(false);
  }, [word.id, correctAnswer]);

  async function review(status: AnswerStatus) {
    setBusy(true);
    try {
      const updatedWord = await saveReview(word.id, status);
      onReviewed?.(updatedWord);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextResult = checkAnswer(answer, correctAnswer);
    setResult(nextResult);
    setShowAnswer(nextResult.status !== "correct");
    await review(nextResult.status);
  }

  async function quickReview(status: "correct" | "wrong") {
    const nextResult =
      status === "correct"
        ? { status, distance: 0, message: "Правильно!" }
        : { status, distance: correctAnswer.length, message: `Неправильно. Правильный ответ: ${correctAnswer}` };
    setResult(nextResult);
    setShowAnswer(true);
    await review(status);
  }

  const ResultIcon = result ? resultIcons[result.status] : null;

  return (
    <div className="space-y-5">
      <TrainingCard word={word} visibility={visibility} title={title} />

      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Вопрос</p>
            <h3 className="mt-1 text-xl font-semibold text-white">{question}</h3>
          </div>
          <Button type="button" variant="ghost" icon={<Eye className="h-4 w-4" />} onClick={() => setShowAnswer(true)}>
            Показать ответ
          </Button>
        </div>

        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <div className="flex-1">
            <Input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Введите ответ и нажмите Enter" autoComplete="off" />
          </div>
          <Button type="submit" variant="primary" icon={<Keyboard className="h-4 w-4" />} disabled={busy || !answer.trim()}>
            Проверить
          </Button>
        </form>

        {showAnswer ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">Правильный ответ: {correctAnswer}</div> : null}

        {result && ResultIcon ? (
          <div className={cn("mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm", resultStyles[result.status])}>
            <ResultIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>{result.message}</p>
              {result.status === "typo" ? <p className="mt-1 text-xs opacity-80">Расстояние Левенштейна: {result.distance}</p> : null}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="success" onClick={() => void quickReview("correct")} disabled={busy}>
            Я вспомнил
          </Button>
          <Button type="button" variant="danger" onClick={() => void quickReview("wrong")} disabled={busy}>
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
