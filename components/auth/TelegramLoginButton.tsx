"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { useToast } from "@/components/Toast";

type TelegramLoginButtonProps = {
  botUsername?: string;
  endpoint: string;
  label?: string;
  onSuccess: () => void;
};

type AuthResponse = {
  ok: boolean;
  error?: {
    message: string;
  };
};

export function TelegramLoginButton({
  botUsername,
  endpoint,
  label = "Continue with Telegram",
  onSuccess
}: TelegramLoginButtonProps) {
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackNameRef = useRef(`onTelegramAuth_${Math.random().toString(36).slice(2)}`);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !botUsername) {
      return;
    }

    const callbackName = callbackNameRef.current;
    const callbacks = window as unknown as Record<string, ((user: unknown) => void) | undefined>;

    callbacks[callbackName] = async (telegramUser: unknown) => {
      setLoading(true);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(telegramUser)
        });
        const data = (await response.json()) as AuthResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.error?.message ?? "Telegram login failed");
        }

        showToast("Telegram подключен", "success");
        onSuccess();
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Не удалось войти через Telegram", "error");
      } finally {
        setLoading(false);
      }
    };

    container.innerHTML = "";
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.dataset.telegramLogin = botUsername.replace(/^@/, "");
    script.dataset.size = "large";
    script.dataset.radius = "8";
    script.dataset.requestAccess = "write";
    script.dataset.onauth = `${callbackName}(user)`;
    container.appendChild(script);

    return () => {
      callbacks[callbackName] = undefined;
      container.innerHTML = "";
    };
  }, [botUsername, endpoint, onSuccess, showToast]);

  if (!botUsername) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-400">
        <div className="flex items-center gap-2 text-slate-200">
          <Send className="h-4 w-4" />
          {label}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Telegram вход появится после настройки TELEGRAM_BOT_USERNAME и TELEGRAM_BOT_TOKEN в `.env`.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={loading ? "pointer-events-none opacity-60" : undefined} ref={containerRef} />
      {loading ? <p className="text-xs text-slate-500">Проверяем Telegram...</p> : null}
    </div>
  );
}
