import { BookOpen, CheckCircle2, Repeat2, Target } from "lucide-react";

import type { WordView } from "@/lib/wordSerializer";

type StatsCardsProps = {
  words: WordView[];
};

export function StatsCards({ words }: StatsCardsProps) {
  const totalWords = words.length;
  const learnedWords = words.filter((word) => word.isLearned).length;
  const reviewWords = words.filter((word) => !word.isLearned).length;
  const correctAnswers = words.reduce((sum, word) => sum + word.correctCount, 0);
  const totalAnswers = words.reduce((sum, word) => sum + word.correctCount + word.wrongCount + word.typoCount, 0);
  const averageCorrect = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  const stats = [
    { label: "Всего слов", value: totalWords, icon: BookOpen, tone: "text-sky-200 bg-sky-400/10 border-sky-300/20" },
    {
      label: "Выучено",
      value: learnedWords,
      icon: CheckCircle2,
      tone: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20"
    },
    {
      label: "На повторении",
      value: reviewWords,
      icon: Repeat2,
      tone: "text-amber-200 bg-amber-400/10 border-amber-300/20"
    },
    {
      label: "Правильных",
      value: `${averageCorrect}%`,
      icon: Target,
      tone: "text-violet-200 bg-violet-400/10 border-violet-300/20"
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div key={stat.label} className="panel p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${stat.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
