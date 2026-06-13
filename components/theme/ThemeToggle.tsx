"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/utils/cn";

type ThemePreference = "light" | "dark" | "system";

const themeOptions: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "system", label: "Системная", icon: Monitor }
];

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function resolveTheme(preference: ThemePreference) {
  if (preference !== "system") {
    return preference;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(preference: ThemePreference) {
  const resolvedTheme = resolveTheme(preference);

  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
  localStorage.setItem("word-memory-theme", preference);
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const storedTheme = localStorage.getItem("word-memory-theme");
    const initialTheme = isThemePreference(storedTheme) ? storedTheme : "system";
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      const currentPreference = localStorage.getItem("word-memory-theme");

      applyTheme(isThemePreference(currentPreference) ? currentPreference : "system");
    };

    setTheme(initialTheme);
    applyTheme(initialTheme);
    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <div
      className={cn(
        "inline-grid rounded-lg border border-white/10 bg-white/[0.05] p-1",
        compact ? "grid-cols-3" : "grid-cols-3"
      )}
      aria-label="Переключение темы"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-2.5 text-xs font-medium transition",
              active ? "bg-sky-500 text-white" : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
            )}
            title={option.label}
            aria-pressed={active}
            onClick={() => {
              setTheme(option.value);
              applyTheme(option.value);
            }}
          >
            <Icon className="h-4 w-4" />
            {compact ? (
              <span className="sr-only">{option.label}</span>
            ) : (
              <span className="hidden xl:inline">{option.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
