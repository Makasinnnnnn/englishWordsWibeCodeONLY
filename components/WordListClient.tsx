"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { WordCard } from "@/components/WordCard";
import type { WordView } from "@/lib/wordSerializer";
import { cn } from "@/utils/cn";

type WordListClientProps = {
  words: WordView[];
};

type Filter = "all" | "new" | "review" | "learned" | "hard";
type Sort = "level" | "errors" | "created" | "reviewed";

const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "review", label: "На повторении" },
  { id: "learned", label: "Выученные" },
  { id: "hard", label: "Сложные" }
];

export function WordListClient({ words }: WordListClientProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("level");

  const visibleWords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return words
      .filter((word) => {
        const matchesQuery =
          !normalizedQuery ||
          word.english.toLowerCase().includes(normalizedQuery) ||
          word.translation.toLowerCase().includes(normalizedQuery) ||
          (word.association ?? "").toLowerCase().includes(normalizedQuery);

        if (!matchesQuery) {
          return false;
        }

        if (filter === "new") {
          return word.learningLevel === 0 && !word.isLearned;
        }

        if (filter === "review") {
          return !word.isLearned;
        }

        if (filter === "learned") {
          return word.isLearned;
        }

        if (filter === "hard") {
          return word.difficulty === "hard" || word.wrongCount > 0;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === "errors") {
          return b.wrongCount - a.wrongCount;
        }

        if (sort === "created") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }

        if (sort === "reviewed") {
          return (new Date(a.lastReviewedAt ?? 0).getTime() || 0) - (new Date(b.lastReviewedAt ?? 0).getTime() || 0);
        }

        return a.learningLevel - b.learningLevel;
      });
  }, [filter, query, sort, words]);

  return (
    <div className="space-y-5">
      <section className="panel p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по слову, переводу или ассоциации"
              className="pl-9"
            />
          </div>
          <Select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="level">По уровню</option>
            <option value="errors">По ошибкам</option>
            <option value="created">По дате добавления</option>
            <option value="reviewed">По последнему повторению</option>
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "focus-ring h-9 rounded-lg border px-3 text-sm transition",
                filter === item.id
                  ? "border-sky-300/60 bg-sky-400/15 text-sky-100"
                  : "border-white/10 bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-white"
              )}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {visibleWords.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleWords.map((word) => (
            <WordCard key={word.id} word={word} />
          ))}
        </div>
      ) : (
        <EmptyState title="Ничего не найдено" description="Попробуйте изменить поиск, фильтр или сортировку." />
      )}
    </div>
  );
}
