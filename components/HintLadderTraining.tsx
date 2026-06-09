"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Eye, Flag, Keyboard, RotateCcw, TriangleAlert, XCircle } from "lucide-react";

import { Button } from "@/components/Button";
import { HintStepProgress } from "@/components/HintStepProgress";
import { Input } from "@/components/Input";
import { ProgressBar } from "@/components/ProgressBar";
import { TrainingCard } from "@/components/TrainingCard";
import type { TrainingSettings } from "@/lib/trainingSettings";
import type { WordView } from "@/lib/wordSerializer";
import { checkAnswer, type AnswerStatus, type CheckAnswerResult } from "@/utils/checkAnswer";
import { cn } from "@/utils/cn";
import { getHintVisibility } from "@/utils/hintLadder";
import { saveReview } from "@/utils/reviewClient";

type HintLadderTrainingProps = {
  word: WordView;
  settings: TrainingSettings;
  title?: string;
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

export function HintLadderTraining({
  word,
  settings,
  title = "Лестница подсказок",
  onNext,
  onReviewed
}: HintLadderTrainingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState<CheckAnswerResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completedWord, setCompletedWord] = useState<WordView | null>(null);
  const [busy, setBusy] = useState(false);

  const totalSteps = settings.ladder.totalSteps;
  const visibility = useMemo(() => {
    const base = getHintVisibility(currentStep, totalSteps);

    if (base.requireManualInput) {
      return {
        ...base,
        showFirstLetter: settings.ladder.finalFirstLetter,
        showWordLength: settings.ladder.finalWordLength
      };
    }

    return base;
  }, [currentStep, settings.ladder.finalFirstLetter, settings.ladder.finalWordLength, totalSteps]);

  useEffect(() => {
    setCurrentStep(1);
    setUserAnswer("");
    setResult(null);
    setShowAnswer(false);
    setCompleted(false);
    setCompletedWord(null);
    setBusy(false);
  }, [word.id, totalSteps]);

  function resetFeedback() {
    setUserAnswer("");
    setResult(null);
    setShowAnswer(false);
  }

  function goNextStep() {
    resetFeedback();
    setCurrentStep((step) => Math.min(totalSteps, step + 1));
  }

  function goPreviousStep() {
    resetFeedback();
    setCurrentStep((step) => Math.max(1, step - 1));
  }

  function restart() {
    resetFeedback();
    setCompleted(false);
    setCompletedWord(null);
    setCurrentStep(1);
  }

  async function review(status: AnswerStatus) {
    setBusy(true);
    try {
      const updatedWord = await saveReview(word.id, status);
      onReviewed?.(updatedWord);
      return updatedWord;
    } finally {
      setBusy(false);
    }
  }

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextResult = checkAnswer(userAnswer, word.english);
    setResult(nextResult);

    if (nextResult.status === "correct") {
      setShowAnswer(false);

      if (currentStep === totalSteps) {
        const updatedWord = await review("correct");
        setCompletedWord(updatedWord);
        setCompleted(true);
        return;
      }

      window.setTimeout(goNextStep, 650);
      return;
    }

    if (nextResult.status === "typo") {
      setShowAnswer(!settings.ladder.retryTypo);
      await review("typo");
      return;
    }

    setShowAnswer(true);
    await review("wrong");
    if (settings.ladder.stepBackOnWrong) {
      setCurrentStep((step) => Math.max(1, step - 1));
    }
  }

  const ResultIcon = result ? resultIcons[result.status] : null;

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-200/80">{title}</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Этап {currentStep} из {totalSteps}
            </h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
            уровень слова: {word.learningLevel}/5
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <HintStepProgress currentStep={currentStep} totalSteps={totalSteps} />
          <ProgressBar value={currentStep} max={totalSteps} label="Прохождение лестницы" tone="emerald" />
        </div>
      </section>

      <TrainingCard
        word={word}
        visibility={visibility}
        title={visibility.requireManualInput ? "Контрольное вспоминание" : "Связка подсказок"}
      />

      <section className="panel p-5">
        {completed ? (
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-500/15 p-5 text-emerald-100">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              Лестница пройдена
            </div>
            <p className="mt-2 text-sm leading-6 text-emerald-100/80">
              Слово засчитано как успешное повторение. Новый уровень:{" "}
              {completedWord?.learningLevel ?? word.learningLevel}/5.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="primary" onClick={onNext}>
                Следующее слово
              </Button>
              <Button type="button" variant="secondary" onClick={restart} icon={<RotateCcw className="h-4 w-4" />}>
                Повторить это слово
              </Button>
            </div>
          </div>
        ) : visibility.requireManualInput ? (
          <form className="space-y-4" onSubmit={handleManualSubmit}>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Финальный ответ</p>
              <h3 className="mt-1 text-xl font-semibold text-white">Напишите английское слово полностью</h3>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  value={userAnswer}
                  onChange={(event) => setUserAnswer(event.target.value)}
                  placeholder="Введите слово и нажмите Enter"
                  autoComplete="off"
                  disabled={busy}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                icon={<Keyboard className="h-4 w-4" />}
                disabled={busy || !userAnswer.trim()}
              >
                Проверить
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Этап запоминания</p>
              <h3 className="mt-1 text-xl font-semibold text-white">Свяжите слово, перевод, образ и ассоциацию</h3>
            </div>
            <Button type="button" variant="primary" onClick={goNextStep}>
              Далее
            </Button>
          </div>
        )}

        {showAnswer ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
            Правильный ответ: {word.english}
          </div>
        ) : null}

        {result && ResultIcon ? (
          <div
            className={cn(
              "mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm",
              resultStyles[result.status]
            )}
          >
            <ResultIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>{result.status === "typo" ? "Почти правильно, проверь написание" : result.message}</p>
              {result.status === "wrong" && settings.ladder.stepBackOnWrong ? (
                <p className="mt-1 text-xs opacity-80">Можно вернуться на предыдущий этап и собрать связку заново.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="ghost" icon={<Eye className="h-4 w-4" />} onClick={() => setShowAnswer(true)}>
            Показать ответ
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={goPreviousStep}
            disabled={currentStep === 1}
          >
            Вернуться на шаг назад
          </Button>
          <Button type="button" variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={restart}>
            Начать заново
          </Button>
          <Button type="button" variant="warning" icon={<Flag className="h-4 w-4" />} onClick={onNext}>
            Завершить тренировку
          </Button>
        </div>
      </section>
    </div>
  );
}
