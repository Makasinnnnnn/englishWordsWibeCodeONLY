"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Dumbbell,
  GalleryHorizontal,
  LibraryBig,
  LineChart,
  Newspaper,
  PlusCircle,
  Settings,
  Sparkles,
  UserCircle
} from "lucide-react";

import type { AuthUser } from "@/lib/auth";
import { cn } from "@/utils/cn";

const navigation = [
  { href: "/cards", label: "Карточки", icon: GalleryHorizontal },
  { href: "/words", label: "Мои слова", icon: BookOpen },
  { href: "/cards/dictionary", label: "Словарь карточек", icon: LibraryBig },
  { href: "/daily", label: "Контент дня", icon: Newspaper },
  { href: "/words/new", label: "Добавить своё", icon: PlusCircle },
  { href: "/training", label: "Тренировка", icon: Dumbbell },
  { href: "/analytics", label: "Аналитика", icon: LineChart },
  { href: "/settings", label: "Настройки", icon: Settings },
  { href: "/settings/account", label: "Аккаунт", icon: UserCircle }
];

export function Sidebar({ user }: { user: AuthUser | null }) {
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-graphite-950/85 px-4 py-5 backdrop-blur lg:block">
      <Link href="/cards" className="mb-8 flex items-center gap-3 rounded-lg px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-400 text-graphite-950">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-semibold text-white">Word Memory</p>
          <p className="text-xs text-slate-500">Trainer</p>
        </div>
      </Link>

      <nav className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/settings" || item.href === "/cards" ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                isActive ? "bg-sky-400/15 text-sky-100" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="text-sm font-medium text-slate-200">Лестница подсказок</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Главный режим тренировки: подсказки исчезают постепенно, пока слово не всплывает само.
        </p>
      </div>
    </aside>
  );
}
