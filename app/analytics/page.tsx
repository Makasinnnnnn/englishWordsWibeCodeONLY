import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  RotateCcw,
  Target,
  Trophy
} from "lucide-react";

import { Button } from "@/components/Button";
import { analyticsPeriods, getCardAnalytics, normalizeAnalyticsPeriod } from "@/lib/analytics/card-analytics";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ChartPoint = { label: string; count: number };

function formatPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

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
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusBar({
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
  const percent = formatPercent(value, total);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-500">
          {value} · {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}

function LearnedChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const width = 960;
  const height = 360;
  const padding = { top: 24, right: 28, bottom: 54, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = Math.max(10, Math.min(34, (chartWidth / Math.max(1, data.length)) * 0.58));
  const cumulative = data.reduce<Array<ChartPoint>>((items, item) => {
    const previous = items[items.length - 1]?.count ?? 0;
    items.push({ label: item.label, count: previous + item.count });
    return items;
  }, []);
  const cumulativeMax = Math.max(1, ...cumulative.map((item) => item.count));
  const yMax = Math.max(max, cumulativeMax);
  const xFor = (index: number) =>
    padding.left + (data.length <= 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth);
  const yFor = (value: number) => padding.top + chartHeight - (value / yMax) * chartHeight;
  const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(yMax * ratio));
  const labelStep = data.length > 30 ? Math.ceil(data.length / 8) : data.length > 14 ? Math.ceil(data.length / 7) : 1;
  const linePoints = cumulative.map((item, index) => `${xFor(index)},${yFor(item.count)}`).join(" ");

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">График по ТЗ</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Выученные слова по дням</h3>
        </div>
        <p className="text-sm text-slate-500">
          За период: <span className="font-semibold text-white">{total}</span>
        </p>
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] p-3">
        <svg
          className="h-[22rem] w-full"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Выученные слова по дням"
        >
          <rect x="0" y="0" width={width} height={height} rx="8" className="fill-transparent" />
          {grid.map((value) => {
            const y = yFor(value);

            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  className="stroke-white/10"
                  strokeWidth="1"
                />
                <text x={padding.left - 12} y={y + 4} textAnchor="end" className="fill-slate-500 text-[12px]">
                  {value}
                </text>
              </g>
            );
          })}
          <line
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={height - padding.bottom}
            className="stroke-white/15"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={height - padding.bottom}
            y2={height - padding.bottom}
            className="stroke-white/15"
            strokeWidth="1"
          />
          {data.map((item, index) => {
            const x = xFor(index);
            const barHeight = item.count > 0 ? Math.max(5, height - padding.bottom - yFor(item.count)) : 2;
            const y = height - padding.bottom - barHeight;

            return (
              <g key={item.label}>
                <rect
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  className={item.count > 0 ? "fill-emerald-400" : "fill-white/10"}
                >
                  <title>{`${item.label}: ${item.count}`}</title>
                </rect>
                {item.count > 0 ? (
                  <text x={x} y={y - 8} textAnchor="middle" className="fill-emerald-100 text-[11px]">
                    {item.count}
                  </text>
                ) : null}
                {index % labelStep === 0 || index === data.length - 1 ? (
                  <text x={x} y={height - 22} textAnchor="middle" className="fill-slate-500 text-[11px]">
                    {item.label}
                  </text>
                ) : null}
              </g>
            );
          })}
          {cumulative.length > 1 ? (
            <polyline
              points={linePoints}
              fill="none"
              className="stroke-sky-300"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : null}
          {cumulative.map((item, index) =>
            item.count > 0 ? (
              <circle
                key={`${item.label}-${item.count}`}
                cx={xFor(index)}
                cy={yFor(item.count)}
                r="4"
                className="fill-sky-200"
              />
            ) : null
          )}
        </svg>
        <div className="mt-3 flex flex-wrap items-center gap-4 px-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            выучено за день
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-0.5 w-5 rounded-full bg-sky-300" />
            накопительно
          </span>
        </div>
      </div>
    </div>
  );
}

function CompactChart({ title, data, color }: { title: string; data: ChartPoint[]; color: string }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const width = 420;
  const height = 150;
  const padding = { top: 16, right: 12, bottom: 28, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = Math.max(4, Math.min(18, (chartWidth / Math.max(1, data.length)) * 0.55));
  const xFor = (index: number) =>
    padding.left + (data.length <= 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth);
  const yFor = (value: number) => padding.top + chartHeight - (value / max) * chartHeight;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-sm tabular-nums text-slate-500">{total}</p>
      </div>
      <svg className="mt-3 h-36 w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={height - padding.bottom}
          y2={height - padding.bottom}
          className="stroke-white/10"
        />
        {data.map((item, index) => {
          const x = xFor(index);
          const barHeight = item.count > 0 ? Math.max(4, height - padding.bottom - yFor(item.count)) : 2;
          const y = height - padding.bottom - barHeight;

          return (
            <rect
              key={item.label}
              x={x - barWidth / 2}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="3"
              className={item.count > 0 ? undefined : "fill-white/10"}
              style={item.count > 0 ? { fill: color } : undefined}
            >
              <title>{`${item.label}: ${item.count}`}</title>
            </rect>
          );
        })}
      </svg>
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
  const analytics = await getCardAnalytics(user.id, period);
  const total = analytics.instant.total;

  const metrics = [
    {
      label: "Выучено",
      value: analytics.instant.learned,
      description: `${formatPercent(analytics.instant.learned, total)}% выбранного словаря.`,
      icon: Trophy,
      tone: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20"
    },
    {
      label: "В ротации",
      value: analytics.instant.rotation,
      description: `${analytics.instant.due} слов уже пора повторить.`,
      icon: RotateCcw,
      tone: "text-sky-200 bg-sky-400/10 border-sky-300/20"
    },
    {
      label: "Уже знал",
      value: analytics.instant.known,
      description: `${formatPercent(analytics.instant.known, total)}% больше не показываются.`,
      icon: CheckCircle2,
      tone: "text-violet-200 bg-violet-400/10 border-violet-300/20"
    },
    {
      label: "Осталось",
      value: analytics.instant.left,
      description: "Новые слова, которые ещё не проходили.",
      icon: Target,
      tone: "text-amber-200 bg-amber-400/10 border-amber-300/20"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Свайп-карточки</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Аналитика выбранного словаря</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/cards">
            <Button variant="primary" icon={<Flame className="h-4 w-4" />}>
              Тренироваться
            </Button>
          </Link>
          <Link href="/cards/dictionary">
            <Button variant="secondary" icon={<BookOpen className="h-4 w-4" />}>
              Словарь карточек
            </Button>
          </Link>
        </div>
      </div>

      <section className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Активный словарь</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">{analytics.dictionary?.title ?? "Не выбран"}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {analytics.dictionary?.level ?? "level"} · версия {analytics.dictionary?.version ?? 0} · всего слов{" "}
              {total}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {analyticsPeriods
              .filter((item) => item !== "today")
              .map((item) => (
                <Link key={item} href={`/analytics?period=${item}`}>
                  <Button type="button" size="sm" variant={item === period ? "primary" : "secondary"}>
                    {periodLabels[item]}
                  </Button>
                </Link>
              ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-300">Прогресс словаря</span>
            <span className="tabular-nums text-slate-500">{analytics.instant.progressPercent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${analytics.instant.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-sm font-medium text-white">Распределение слов</p>
            <div className="mt-4 space-y-4">
              <StatusBar label="Выучено" value={analytics.instant.learned} total={total} className="bg-emerald-400" />
              <StatusBar label="В ротации" value={analytics.instant.rotation} total={total} className="bg-sky-400" />
              <StatusBar label="Уже знал" value={analytics.instant.known} total={total} className="bg-violet-400" />
              <StatusBar label="Осталось" value={analytics.instant.left} total={total} className="bg-amber-400" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="К повторению"
              value={analytics.instant.due}
              description="Срок повторения уже наступил."
              icon={CalendarClock}
              tone="text-amber-200 bg-amber-400/10 border-amber-300/20"
            />
            <MetricCard
              label="Повторено сегодня"
              value={analytics.instant.reviewedToday}
              description="Ответы Я запомнил / Не запомнил."
              icon={Clock3}
              tone="text-sky-200 bg-sky-400/10 border-sky-300/20"
            />
            <MetricCard
              label="Новых в ротации"
              value={analytics.periodTotals.newToRotation}
              description={`За период: ${periodLabels[period]}.`}
              icon={BookOpen}
              tone="text-cyan-200 bg-cyan-400/10 border-cyan-300/20"
            />
            <MetricCard
              label="Не запомнил"
              value={analytics.periodTotals.forgotten}
              description="Сброшены на 5 минут и 1 час."
              icon={BarChart3}
              tone="text-red-200 bg-red-400/10 border-red-300/20"
            />
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <LearnedChart data={analytics.learnedByDay} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <CompactChart title="Повторения по дням" data={analytics.activityByDay} color="#38bdf8" />
        <CompactChart title="Ошибки по дням" data={analytics.forgottenByDay} color="#f87171" />
        <CompactChart title="Новые в ротации" data={analytics.newToRotationByDay} color="#fbbf24" />
      </section>
    </div>
  );
}
