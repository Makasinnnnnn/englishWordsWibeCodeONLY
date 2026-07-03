import Link from "next/link";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { WordListClient } from "@/components/WordListClient";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeWords } from "@/lib/wordSerializer";

export const dynamic = "force-dynamic";

export default async function WordsPage() {
  const user = await requireUser();
  const words = serializeWords(
    await prisma.word.findMany({
      where: { userId: user.id },
      orderBy: [{ isLearned: "asc" }, { learningLevel: "asc" }, { updatedAt: "desc" }]
    })
  );

  if (words.length === 0) {
    return (
      <EmptyState
        title="Личный словарь пуст"
        description="Эта вкладка только для ваших собственных слов и старого режима тренировки. Дефолтная колода карточек редактируется отдельно."
        actionLabel="Добавить своё слово"
        actionHref="/words/new"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Всего личных слов: {words.length}</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Мои слова</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Этот словарь используется в режимах тренировки личных слов. Свайп-карточки используют отдельную дефолтную
            колоду.
          </p>
        </div>
        <Link href="/cards/dictionary">
          <Button type="button" variant="secondary">
            Открыть словарь карточек
          </Button>
        </Link>
      </div>

      <WordListClient words={words} />
    </div>
  );
}
