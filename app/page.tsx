import Link from "next/link";
import { Dumbbell, GalleryHorizontal, Newspaper, PlusCircle } from "lucide-react";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { StatsCards } from "@/components/StatsCards";
import { WordCard } from "@/components/WordCard";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeWords } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const words = serializeWords(
    await prisma.word.findMany({
      where: { userId: user.id },
      orderBy: [{ updatedAt: "desc" }],
      take: 6
    })
  );
  const allWords = serializeWords(await prisma.word.findMany({ where: { userId: user.id } }));
  const now = Date.now();
  const dueWords = allWords
    .filter((word) => !word.isLearned && (!word.nextReviewAt || new Date(word.nextReviewAt).getTime() <= now))
    .sort((a, b) => a.learningLevel - b.learningLevel || b.wrongCount - a.wrongCount)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-200/80">Word Memory Trainer</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-white md:text-5xl">
              Личный тренажер английских слов с ассоциациями и лестницей подсказок
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Добавляйте слова, перевод, личные ассоциации и изображения, а затем тренируйтесь в режимах теста, ручного
              ввода и главной лестницы подсказок.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/words/new">
                <Button variant="primary" size="lg" icon={<PlusCircle className="h-5 w-5" />}>
                  Добавить слово
                </Button>
              </Link>
              <Link href="/training">
                <Button variant="secondary" size="lg" icon={<Dumbbell className="h-5 w-5" />}>
                  Начать тренировку
                </Button>
              </Link>
              <Link href="/cards">
                <Button variant="secondary" size="lg" icon={<GalleryHorizontal className="h-5 w-5" />}>
                  Свайп-карточки
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-graphite-900 p-5">
            <p className="text-sm font-medium text-slate-200">Сегодняшний фокус</p>
            <p className="mt-3 text-4xl font-semibold text-white">Главный режим</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Подсказки исчезают по этапам, а финальная проверка закрепляет слово через ручной ввод.
            </p>
          </div>
        </div>
      </section>

      <StatsCards words={allWords} />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Сегодня повторить</p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {dueWords.length > 0 ? `${dueWords.length} слова ждут тренировки` : "Очередь чистая"}
              </h2>
            </div>
            <Link href="/training">
              <Button variant="primary" icon={<Dumbbell className="h-4 w-4" />}>
                Тренироваться
              </Button>
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {dueWords.length > 0 ? (
              dueWords.map((word) => (
                <Link
                  key={word.id}
                  href={`/training/${word.id}`}
                  className="rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-sky-300/40 hover:bg-white/[0.06]"
                >
                  <p className="text-lg font-semibold text-white">{word.english}</p>
                  <p className="mt-1 text-sm text-slate-400">{word.translation}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Уровень {word.learningLevel} · ошибок {word.wrongCount}
                  </p>
                </Link>
              ))
            ) : (
              <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400 sm:col-span-2">
                Добавьте новые слова или повторите выученные в свободном режиме.
              </p>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Быстрые действия</p>
          <div className="mt-4 grid gap-3">
            <Link href="/words/new">
              <Button variant="secondary" className="w-full justify-start" icon={<PlusCircle className="h-4 w-4" />}>
                Добавить слово
              </Button>
            </Link>
            <Link href="/words">
              <Button variant="secondary" className="w-full justify-start">
                Открыть словарь
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="secondary" className="w-full justify-start">
                Настроить подсказки
              </Button>
            </Link>
            <Link href="/daily">
              <Button variant="secondary" className="w-full justify-start" icon={<Newspaper className="h-4 w-4" />}>
                Контент дня
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {words.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Недавние слова</h2>
            <Link href="/words" className="text-sm text-sky-200 hover:text-sky-100">
              Открыть словарь
            </Link>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {words.map((word) => (
              <WordCard key={word.id} word={word} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Словарь пуст"
          description="Добавьте первое слово, чтобы увидеть статистику и начать тренировку."
          actionLabel="Добавить слово"
          actionHref="/words/new"
        />
      )}
    </div>
  );
}
