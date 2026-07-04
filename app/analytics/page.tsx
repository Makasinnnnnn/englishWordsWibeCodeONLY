import Link from "next/link";
import { AlertTriangle, BarChart3, BookOpen, CalendarClock, CheckCircle2, Flame, Target, Trophy } from "lucide-react";

import { Button } from "@/components/Button";
import { analyticsPeriods, getCardAnalytics, normalizeAnalyticsPeriod } from "@/lib/analytics/card-analytics";
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

const periodLabels = {
  today: "Сегодня",
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
  all: "Всё время"
};

export default async function AnalyticsPage({ searchParams }: { searchParams?: { period?: string } }) {
  const user = await requireUser();
  const period = normalizeAnalyticsPeriod(searchParams?.period);
  const words = await prisma.word.findMany({
    where: { userId: user.id },
    orderBy: [{ wrongCount: "desc" }, { typoCount: "desc" }, { updatedAt: "desc" }]
  });
  const analytics = buildWordAnalytics(words);
  const totalAnswers = analytics.correctAnswers + analytics.wrongAnswers + analytics.typoAnswers;
  const cardAnalytics = await getCardAnalytics(user.id, period);
  const maxLearnedByDay = Math.max(1, ...cardAnalytics.learnedByDay.map((item) => item.count));
  const maxActivityByDay = Math.max(1, ...cardAnalytics.activityByDay.map((item) => item.count));

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

      {cardAnalytics.dictionary ? (
        <section className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Свайп-карточки</p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                Активный словарь: {cardAnalytics.dictionary.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {cardAnalytics.dictionary.level ?? "level"} · версия {cardAnalytics.dictionary.version} · прогресс{" "}
                {cardAnalytics.instant.progressPercent}%
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {analyticsPeriods.map((item) => (
                <Link key={item} href={`/analytics?period=${item}`}>
                  <Button type="button" size="sm" variant={item === period ? "primary" : "secondary"}>
                    {periodLabels[item]}
                  </Button>
                </Link>
              ))}
              <Link href="/cards">
                <Button variant="secondary" size="sm">
                  Открыть карточки
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DistributionBar
              label="Выучено"
              value={cardAnalytics.instant.learned}
              total={cardAnalytics.instant.total}
              className="bg-emerald-400"
            />
            <DistributionBar
              label="В ротации"
              value={cardAnalytics.instant.rotation}
              total={cardAnalytics.instant.total}
              className="bg-sky-400"
            />
            <DistributionBar
              label="Уже знал"
              value={cardAnalytics.instant.known}
              total={cardAnalytics.instant.total}
              className="bg-violet-400"
            />
            <DistributionBar
              label="Осталось"
              value={cardAnalytics.instant.left}
              total={cardAnalytics.instant.total}
              className="bg-amber-400"
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-slate-400">К повторению сейчас</p>
              <p className="mt-1 text-2xl font-semibold text-white">{cardAnalytics.instant.due}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-slate-400">Повторено сегодня</p>
              <p className="mt-1 text-2xl font-semibold text-white">{cardAnalytics.instant.reviewedToday}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-slate-400">Выучено сегодня</p>
              <p className="mt-1 text-2xl font-semibold text-white">{cardAnalytics.instant.learnedToday}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-slate-400">Действий за период</p>
              <p className="mt-1 text-2xl font-semibold text-white">{cardAnalytics.periodTotals.activity}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-slate-400">Повторений за период</p>
              <p className="mt-1 text-2xl font-semibold text-white">{cardAnalytics.periodTotals.reviews}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-slate-400">Новых в ротации</p>
              <p className="mt-1 text-2xl font-semibold text-white">{cardAnalytics.periodTotals.newToRotation}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-sm text-slate-400">Переведено в learned</p>
              <p className="mt-1 text-2xl font-semibold text-white">{cardAnalytics.periodTotals.learned}</p>
            </div>
          </div>

          {cardAnalytics.periodTotals.activity > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-white">Выучено по дням</p>
                <div className="mt-4 flex h-40 items-end gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  {cardAnalytics.learnedByDay.map((item) => (
                    <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-md bg-emerald-400"
                        style={{ height: `${Math.max(4, (item.count / maxLearnedByDay) * 100)}%` }}
                        title={`${item.label}: ${item.count}`}
                      />
                      <span className="w-full truncate text-center text-[10px] text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Активность по дням</p>
                <div className="mt-4 flex h-40 items-end gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  {cardAnalytics.activityByDay.map((item) => (
                    <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-md bg-sky-400"
                        style={{ height: `${Math.max(4, (item.count / maxActivityByDay) * 100)}%` }}
                        title={`${item.label}: ${item.count}`}
                      />
                      <span className="w-full truncate text-center text-[10px] text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">
              За выбранный период пока нет данных.
            </p>
          )}
        </section>
      ) : null}

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
