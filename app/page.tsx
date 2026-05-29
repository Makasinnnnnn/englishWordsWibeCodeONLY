import Link from "next/link";
import { Dumbbell, PlusCircle } from "lucide-react";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { StatsCards } from "@/components/StatsCards";
import { WordCard } from "@/components/WordCard";
import { prisma } from "@/lib/prisma";
import { serializeWords } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const words = serializeWords(
    await prisma.word.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 6
    })
  );
  const allWords = serializeWords(await prisma.word.findMany());

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-200/80">Word Memory Trainer</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-white md:text-5xl">Личный тренажер английских слов с ассоциациями и лестницей подсказок</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Добавляйте слова, перевод, личные ассоциации и изображения, а затем тренируйтесь в режимах Multiple Choice, Manual Input и Hint Ladder.
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
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-graphite-900 p-5">
            <p className="text-sm font-medium text-slate-200">Сегодняшний фокус</p>
            <p className="mt-3 text-4xl font-semibold text-white">Hint Ladder</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">Подсказки исчезают по этапам, а финальная проверка закрепляет слово через ручной ввод.</p>
          </div>
        </div>
      </section>

      <StatsCards words={allWords} />

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
        <EmptyState title="Словарь пуст" description="Добавьте первое слово, чтобы увидеть статистику и начать тренировку." actionLabel="Добавить слово" actionHref="/words/new" />
      )}
    </div>
  );
}
