"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Menu, PlusCircle } from "lucide-react";

import { Button } from "@/components/Button";
import { LogoutButton } from "@/components/LogoutButton";
import type { AuthUser } from "@/lib/auth";

const titles: Array<[string, string]> = [
  ["/login", "Вход"],
  ["/register", "Создание аккаунта"],
  ["/words/new", "Добавление слова"],
  ["/words", "Словарь"],
  ["/training", "Тренировка"],
  ["/settings", "Настройки"],
  ["/", "Панель обучения"]
];

function getTitle(pathname: string) {
  return titles.find(([path]) => (path === "/" ? pathname === "/" : pathname.startsWith(path)))?.[1] ?? "Word Memory Trainer";
}

export function Header({ user }: { user: AuthUser | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-graphite-950/75 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Word Memory Trainer</p>
          <h1 className="truncate text-xl font-semibold text-white">{getTitle(pathname)}</h1>
        </div>

        {user ? (
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/words/new">
              <Button variant="secondary" icon={<PlusCircle className="h-4 w-4" />}>
                Добавить слово
              </Button>
            </Link>
            <Link href="/training">
              <Button variant="primary" icon={<Dumbbell className="h-4 w-4" />}>
                Начать тренировку
              </Button>
            </Link>
            <LogoutButton />
          </div>
        ) : null}

        <div className="sm:hidden">
          <Link href={user ? "/words" : "/login"}>
            <Button variant="ghost" size="icon" aria-label="Открыть навигацию" icon={<Menu className="h-5 w-5" />} />
          </Link>
        </div>
      </div>
    </header>
  );
}
