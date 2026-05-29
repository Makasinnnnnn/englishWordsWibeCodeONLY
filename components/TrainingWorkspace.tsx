"use client";

import { useEffect, useMemo, useState } from "react";
import { GalleryHorizontal, Keyboard, ListChecks, Mountain, Shuffle, Sparkles, SpellCheck } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { HintLadderTraining } from "@/components/HintLadderTraining";
import { ManualInputQuiz } from "@/components/ManualInputQuiz";
import { MultipleChoiceQuiz } from "@/components/MultipleChoiceQuiz";
import { TrainingSidebar } from "@/components/TrainingSidebar";
import { defaultTrainingSettings, mergeTrainingSettings, trainingSettingsStorageKey, type TrainingSettings } from "@/lib/trainingSettings";
import type { WordView } from "@/lib/wordSerializer";
import { cn } from "@/utils/cn";
import type { HintVisibility } from "@/utils/hintLadder";
import { shuffleArray, sortWordsForTraining } from "@/utils/trainingQueue";

type TrainingWorkspaceProps = {
  initialWords: WordView[];
  startWordId?: string;
};

type TrainingMode = "ladder" | "multiple" | "manual" | "reverse" | "image" | "progressive";

const modes: Array<{ id: TrainingMode; label: string; icon: typeof Sparkles; primary?: boolean }> = [
  { id: "ladder", label: "Hint Ladder", icon: Mountain, primary: true },
  { id: "multiple", label: "Multiple Choice", icon: ListChecks },
  { id: "manual", label: "Manual Input", icon: Keyboard },
  { id: "reverse", label: "Reverse Translation", icon: SpellCheck },
  { id: "image", label: "Image Association", icon: GalleryHorizontal },
  { id: "progressive", label: "Progressive Hints", icon: Shuffle }
];

function visibilityFromSettings(settings: TrainingSettings): HintVisibility {
  return {
    showEnglish: settings.showEnglish,
    showTranslation: settings.showTranslation,
    showAssociation: settings.showAssociation,
    showImage: settings.showImage,
    showNotes: settings.showNotes,
    showFirstLetter: settings.showFirstLetter,
    showWordLength: settings.showWordLength,
    requireManualInput: false
  };
}

export function TrainingWorkspace({ initialWords, startWordId }: TrainingWorkspaceProps) {
  const [words, setWords] = useState(initialWords);
  const [settings, setSettings] = useState<TrainingSettings>(defaultTrainingSettings);
  const [mode, setMode] = useState<TrainingMode>("ladder");
  const [index, setIndex] = useState(0);
  const [startResolved, setStartResolved] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(trainingSettingsStorageKey);
    if (raw) {
      setSettings(mergeTrainingSettings(JSON.parse(raw) as Partial<TrainingSettings>));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(trainingSettingsStorageKey, JSON.stringify(settings));
  }, [settings]);

  const queue = useMemo(() => {
    const sorted = sortWordsForTraining(words);
    return settings.shuffleWords ? shuffleArray(sorted) : sorted;
  }, [settings.shuffleWords, words]);

  useEffect(() => {
    if (!startWordId || startResolved) {
      return;
    }

    const startIndex = queue.findIndex((word) => word.id === startWordId);
    if (startIndex >= 0) {
      setIndex(startIndex);
      setStartResolved(true);
    }
  }, [queue, startResolved, startWordId]);

  const currentWord = queue[index % Math.max(queue.length, 1)];

  function handleReviewed(updatedWord: WordView) {
    setWords((current) => current.map((word) => (word.id === updatedWord.id ? updatedWord : word)));
  }

  function nextWord() {
    setIndex((current) => (queue.length > 0 ? (current + 1) % queue.length : 0));
  }

  if (queue.length === 0) {
    return <EmptyState title="Словарь пуст" description="Словарь пуст. Добавьте первое слово, чтобы начать тренировку." actionLabel="Добавить слово" actionHref="/words/new" />;
  }

  const baseVisibility = visibilityFromSettings(settings);
  const reverseVisibility: HintVisibility = {
    showEnglish: true,
    showTranslation: false,
    showAssociation: false,
    showImage: false,
    showNotes: false,
    showFirstLetter: false,
    showWordLength: false,
    requireManualInput: true
  };
  const imageVisibility: HintVisibility = {
    showEnglish: false,
    showTranslation: false,
    showAssociation: true,
    showImage: true,
    showNotes: settings.showNotes,
    showFirstLetter: settings.showFirstLetter,
    showWordLength: settings.showWordLength,
    requireManualInput: true
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <TrainingSidebar settings={settings} onChange={setSettings} />

      <div className="min-w-0 space-y-5">
        <section className="panel p-4">
          <div className="flex flex-wrap gap-2">
            {modes.map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "focus-ring inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition",
                    active && "border-sky-300/60 bg-sky-400/15 text-sky-100",
                    !active && item.primary && "border-emerald-300/25 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15",
                    !active && !item.primary && "border-white/10 bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-white"
                  )}
                  onClick={() => setMode(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        {mode === "ladder" ? (
          <HintLadderTraining word={currentWord} settings={settings} onNext={nextWord} onReviewed={handleReviewed} />
        ) : null}

        {mode === "multiple" ? (
          <MultipleChoiceQuiz word={currentWord} words={queue} visibility={baseVisibility} answerField="english" onNext={nextWord} onReviewed={handleReviewed} />
        ) : null}

        {mode === "manual" ? (
          <ManualInputQuiz word={currentWord} visibility={baseVisibility} question="Введите английское слово" correctAnswer={currentWord.english} onNext={nextWord} onReviewed={handleReviewed} />
        ) : null}

        {mode === "reverse" ? (
          <ManualInputQuiz
            word={currentWord}
            visibility={reverseVisibility}
            title="Reverse Translation"
            question="Введите перевод"
            correctAnswer={currentWord.translation}
            onNext={nextWord}
            onReviewed={handleReviewed}
          />
        ) : null}

        {mode === "image" ? (
          <ManualInputQuiz
            word={currentWord}
            visibility={imageVisibility}
            title="Image Association"
            question="Вспомните английское слово по картинке и ассоциации"
            correctAnswer={currentWord.english}
            onNext={nextWord}
            onReviewed={handleReviewed}
          />
        ) : null}

        {mode === "progressive" ? (
          <HintLadderTraining word={currentWord} settings={{ ...settings, ladder: { ...settings.ladder, totalSteps: 5 } }} title="Progressive Hints" onNext={nextWord} onReviewed={handleReviewed} />
        ) : null}
      </div>
    </div>
  );
}
