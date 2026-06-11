"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share } from "lucide-react";

import { Button } from "@/components/Button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isiOS = useMemo(() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay() || localStorage.getItem("word-memory-install-dismissed") === "1") {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (isiOS) {
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [isiOS]);

  if (!visible || dismissed) {
    return null;
  }

  async function install() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  function dismiss() {
    localStorage.setItem("word-memory-install-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-lg border border-white/10 bg-graphite-850/95 p-4 shadow-glow backdrop-blur lg:bottom-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-sky-100">
          {isiOS ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Установить как приложение</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {isiOS
              ? "В Safari нажмите «Поделиться», затем «На экран Домой»."
              : "Откройте тренажёр с главного экрана без лишних вкладок браузера."}
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
          Позже
        </Button>
        {!isiOS && deferredPrompt ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            icon={<Download className="h-4 w-4" />}
            onClick={() => void install()}
          >
            Установить
          </Button>
        ) : null}
      </div>
    </div>
  );
}
