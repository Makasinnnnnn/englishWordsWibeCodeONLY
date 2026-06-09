"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/utils/cn";

type ToastTone = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
  warning: TriangleAlert
};

const tones = {
  success: "border-emerald-400/20 bg-emerald-500/15 text-emerald-100",
  error: "border-red-400/20 bg-red-500/15 text-red-100",
  info: "border-sky-400/20 bg-sky-500/15 text-sky-100",
  warning: "border-amber-400/20 bg-amber-500/15 text-amber-100"
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = Date.now() + Math.random();
      setToasts((items) => [...items, { id, message, tone }]);
      window.setTimeout(() => removeToast(id), 3200);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = icons[toast.tone];

          return (
            <div
              key={toast.id}
              className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 shadow-glow", tones[toast.tone])}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 text-sm">{toast.message}</p>
              <button
                type="button"
                className="rounded p-1 hover:bg-white/10"
                onClick={() => removeToast(toast.id)}
                aria-label="Закрыть уведомление"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
