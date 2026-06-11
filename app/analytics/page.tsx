import Link from "next/link";
import { AlertTriangle, BarChart3, BookOpen, CalendarClock, CheckCircle2, Flame, Target, Trophy } from "lucide-react";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { buildWordAnalytics } from "@/lib/analytics/word-analytics";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone
}: {
  label: string;
  value: string | number;
  description: string;
  icon: typeof BarChart3;
  tone: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DistributionBar({
  label,
  value,
  total,
  className
}: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-500">
          {value} · {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  const words = await prisma.word.findMany({
    where: { userId: user.id },
    orderBy: [{ wrongCount: "desc" }, { typoCount: "desc" }, { updatedAt: "desc" }]
  });
  const analytics = buildWordAnalytics(words);
  const totalAnswers = analytics.correctAnswers + analytics.wrongAnswers + analytics.typoAnswers;

  if (analytics.totalWords === 0) {
    return (
      <EmptyState
        title="Пока нет аналитики"
        description="Добавьте первые слова и пройдите тренировку, чтобы увидеть прогресс, точность и сложные места."
        actionLabel="Добавить слово"
        actionHref="/words/new"
      />
    );
  }

  const metrics = [
    {
      label: "Всего слов",
      value: analytics.totalWords,
      description: `${analytics.learningWords} сейчас в активном изучении.`,
      icon: BookOpen,
      tone: "text-sky-200 bg-sky-400/10 border-sky-300/20"
    },
    {
      label: "Выучено",
      value: analytics.learnedWords,
      description: "Слова, закрепленные на верхних уровнях повторения.",
      icon: Trophy,
      tone: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20"
    },
    {
      label: "К повторению",
      value: analytics.dueToday,
      description: `${analytics.overdueWords} уже просрочено.`,
      icon: CalendarClock,
      tone: "text-amber-200 bg-amber-400/10 border-amber-300/20"
    },
    {
      label: "Точность",
      value: `${analytics.accuracy}%`,
      description: `${analytics.totalReviews} сохраненных ответов в тренировках.`,
      icon: Target,
      tone: "text-violet-200 bg-violet-400/10 border-violet-300/20"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Личная статистика</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Аналитика обучения</h2>
        </div>
        <div className="flex gap-3">
          <Link href="/training">
            <Button variant="primary" icon={<Flame className="h-4 w-4" />}>
              Тренироваться
            </Button>
          </Link>
          <Link href="/words">
            <Button variant="secondary" icon={<BookOpen className="h-4 w-4" />}>
              Словарь
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Ответы</p>
              <h3 className="mt-1 text-xl font-semibold text-white">Распределение результатов</h3>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-200" />
          </div>
          <div className="mt-5 space-y-4">
            <DistributionBar
              label="Правильно"
              value={analytics.correctAnswers}
              total={totalAnswers}
              className="bg-emerald-400"
            />
            <DistributionBar
              label="Опечатки"
              value={analytics.typoAnswers}
              total={totalAnswers}
              className="bg-amber-400"
            />
            <DistributionBar
              label="Ошибки"
              value={analytics.wrongAnswers}
              total={totalAnswers}
              className="bg-red-400"
            />
          </div>
        </div>

        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Неделя</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-slate-400">Добавлено слов</p>
              <p className="mt-1 text-2xl font-semibold text-white">{analytics.wordsAddedThisWeek}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-slate-400">Активных слов</p>
              <p className="mt-1 text-2xl font-semibold text-white">{analytics.activeWordsThisWeek}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-slate-400">Средний уровень</p>
              <p className="mt-1 text-2xl font-semibold text-white">{analytics.averageLearningLevel} / 5</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Фокус</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Сложные слова</h3>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-200" />
        </div>

        {analytics.hardestWords.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {analytics.hardestWords.map((word) => (
              <Link
                key={word.id}
                href={`/training/${word.id}`}
                className="rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-sky-300/40 hover:bg-white/[0.06]"
              >
                <p className="text-lg font-semibold text-white">{word.english}</p>
                <p className="mt-1 text-sm text-slate-400">{word.translation}</p>
                <p className="mt-3 text-xs text-slate-500">
                  Ошибок {word.wrongCount} · опечаток {word.typoCount} · уровень {word.learningLevel}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">
            Пока нет слов с ошибками. После тренировок здесь появятся слова, которые стоит повторить первыми.
          </p>
        )}
      </section>
    </div>
  );
}
