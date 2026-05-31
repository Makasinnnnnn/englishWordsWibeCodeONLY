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
    return <EmptyState title="Словарь пуст" description="Словарь пуст. Добавьте первое слово." actionLabel="Добавить слово" actionHref="/words/new" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Всего слов: {words.length}</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Личный словарь</h2>
        </div>
      </div>

      <WordListClient words={words} />
    </div>
  );
}
