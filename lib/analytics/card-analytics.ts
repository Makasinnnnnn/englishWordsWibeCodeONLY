import { buildCardStats } from "@/lib/cards/queue";
import { getActiveDictionaryForUser } from "@/lib/dictionaries/active";
import { prisma } from "@/lib/prisma";

export const analyticsPeriods = ["today", "7d", "30d", "90d", "all"] as const;
export type AnalyticsPeriod = (typeof analyticsPeriods)[number];

export type CardAnalyticsView = {
  dictionary: {
    id: string;
    slug: string;
    title: string;
    level: string | null;
    version: number;
  } | null;
  period: AnalyticsPeriod;
  periodLabel: string;
  instant: {
    total: number;
    learned: number;
    rotation: number;
    known: number;
    left: number;
    due: number;
    reviewedToday: number;
    learnedToday: number;
    progressPercent: number;
  };
  periodTotals: {
    reviews: number;
    newToRotation: number;
    learned: number;
    activity: number;
  };
  learnedByDay: Array<{ label: string; count: number }>;
  activityByDay: Array<{ label: string; count: number }>;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getPeriodStart(period: AnalyticsPeriod, now: Date) {
  if (period === "all") {
    return null;
  }

  const start = startOfDay(now);

  if (period === "today") {
    return start;
  }

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  start.setDate(start.getDate() - (days - 1));
  return start;
}

function getPeriodLabel(period: AnalyticsPeriod) {
  switch (period) {
    case "today":
      return "Сегодня";
    case "7d":
      return "7 дней";
    case "30d":
      return "30 дней";
    case "90d":
      return "90 дней";
    case "all":
      return "Всё время";
  }
}

function buildDailySeries(events: Array<{ createdAt: Date; statusAfter: string }>, period: AnalyticsPeriod, now: Date) {
  const days = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 14;
  const firstDay = startOfDay(now);
  firstDay.setDate(firstDay.getDate() - (days - 1));

  return Array.from({ length: days }, (_, index) => {
    const day = new Date(firstDay);
    day.setDate(day.getDate() + index);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayEvents = events.filter((event) => event.createdAt >= day && event.createdAt < nextDay);

    return {
      label: new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short" }).format(day),
      learned: dayEvents.filter((event) => event.statusAfter === "learned").length,
      activity: dayEvents.length
    };
  });
}

export function normalizeAnalyticsPeriod(value: string | null | undefined): AnalyticsPeriod {
  return analyticsPeriods.includes(value as AnalyticsPeriod) ? (value as AnalyticsPeriod) : "7d";
}

export async function getCardAnalytics(userId: string, period: AnalyticsPeriod, now = new Date()): Promise<CardAnalyticsView> {
  const dictionary = await getActiveDictionaryForUser(userId);

  if (!dictionary) {
    return {
      dictionary: null,
      period,
      periodLabel: getPeriodLabel(period),
      instant: {
        total: 0,
        learned: 0,
        rotation: 0,
        known: 0,
        left: 0,
        due: 0,
        reviewedToday: 0,
        learnedToday: 0,
        progressPercent: 0
      },
      periodTotals: { reviews: 0, newToRotation: 0, learned: 0, activity: 0 },
      learnedByDay: [],
      activityByDay: []
    };
  }

  const periodStart = getPeriodStart(period, now);
  const todayStart = startOfDay(now);
  const [words, progress, periodEvents, todayEvents] = await Promise.all([
    prisma.dictionaryWord.findMany({
      where: { dictionaryId: dictionary.id, archived: false },
      orderBy: [{ position: "asc" }, { english: "asc" }]
    }),
    prisma.cardProgress.findMany({
      where: {
        userId,
        word: { dictionaryId: dictionary.id, archived: false }
      }
    }),
    prisma.cardReviewEvent.findMany({
      where: {
        userId,
        word: { dictionaryId: dictionary.id, archived: false },
        createdAt: periodStart ? { gte: periodStart } : undefined
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.cardReviewEvent.findMany({
      where: {
        userId,
        word: { dictionaryId: dictionary.id, archived: false },
        createdAt: { gte: todayStart }
      }
    })
  ]);
  const stats = buildCardStats(words, progress, now);
  const daily = buildDailySeries(periodEvents, period, now);
  const progressPercent = stats.total > 0 ? Math.round(((stats.learned + stats.known) / stats.total) * 100) : 0;

  return {
    dictionary: {
      id: dictionary.id,
      slug: dictionary.slug,
      title: dictionary.title,
      level: dictionary.level,
      version: dictionary.version
    },
    period,
    periodLabel: getPeriodLabel(period),
    instant: {
      ...stats,
      reviewedToday: todayEvents.filter((event) => event.action === "remembered" || event.action === "forgot").length,
      learnedToday: todayEvents.filter((event) => event.statusAfter === "learned").length,
      progressPercent
    },
    periodTotals: {
      reviews: periodEvents.filter((event) => event.action === "remembered" || event.action === "forgot").length,
      newToRotation: periodEvents.filter((event) => event.action === "unknown").length,
      learned: periodEvents.filter((event) => event.statusAfter === "learned").length,
      activity: periodEvents.length
    },
    learnedByDay: daily.map((item) => ({ label: item.label, count: item.learned })),
    activityByDay: daily.map((item) => ({ label: item.label, count: item.activity }))
  };
}
