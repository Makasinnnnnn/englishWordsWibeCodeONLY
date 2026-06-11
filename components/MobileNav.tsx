"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Dumbbell, Settings } from "lucide-react";

import { cn } from "@/utils/cn";

const mobileNavigation = [
  { href: "/words", label: "Словарь", icon: BookOpen },
  { href: "/training", label: "Тренировка", icon: Dumbbell },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings }
];

export function MobileNav({ visible }: { visible: boolean }) {
  const pathname = usePathname();

  if (!visible) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-graphite-950/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium transition",
                active ? "bg-sky-400/15 text-sky-100" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
