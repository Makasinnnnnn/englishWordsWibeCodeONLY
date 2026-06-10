"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCw, Send } from "lucide-react";

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
    code?: string;
    message: string;
  };
};

type TelegramBotStartResponse = AuthResponse & {
  data?: {
    token: string;
    loginUrl: string;
    expiresAt: string;
  };
};

type TelegramBotStatusResponse = AuthResponse & {
  data?: {
    status: "pending" | "confirmed" | "linked";
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
  const pollingRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingBot, setStartingBot] = useState(false);
  const [checkingBot, setCheckingBot] = useState(false);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [botLoginUrl, setBotLoginUrl] = useState<string | null>(null);
  const [botExpiresAt, setBotExpiresAt] = useState<string | null>(null);
  const mode = endpoint.includes("/link") ? "link" : "auth";

  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const completeBotFlow = useCallback(
    (status: "confirmed" | "linked") => {
      clearPolling();
      setBotToken(null);
      setBotLoginUrl(null);
      setBotExpiresAt(null);
      showToast(status === "linked" ? "Telegram привязан" : "Вход через Telegram выполнен", "success");
      onSuccess();
    },
    [clearPolling, onSuccess, showToast]
  );

  const checkBotStatus = useCallback(
    async (token: string, manual = false) => {
      setCheckingBot(true);

      try {
        const response = await fetch(`/api/auth/telegram/bot/status?token=${encodeURIComponent(token)}`, {
          method: "GET"
        });
        const data = (await response.json()) as TelegramBotStatusResponse;

        if (!response.ok || !data.ok) {
          if (data.error?.code === "TOKEN_EXPIRED") {
            clearPolling();
            setBotToken(null);
            setBotLoginUrl(null);
            setBotExpiresAt(null);
          }

          throw new Error(data.error?.message ?? "Не удалось проверить Telegram");
        }

        if (data.data?.status === "pending") {
          if (manual) {
            showToast("Пока не видим подтверждение. Нажмите Start в Telegram и вернитесь сюда.", "info");
          }
          return;
        }

        if (data.data?.status === "confirmed" || data.data?.status === "linked") {
          completeBotFlow(data.data.status);
        }
      } catch (error) {
        if (manual) {
          showToast(error instanceof Error ? error.message : "Не удалось проверить Telegram", "error");
        }
      } finally {
        setCheckingBot(false);
      }
    },
    [clearPolling, completeBotFlow, showToast]
  );

  const startBotLogin = useCallback(async () => {
    const popup = window.open("about:blank", "_blank");

    try {
      setStartingBot(true);
      clearPolling();

      const response = await fetch("/api/auth/telegram/bot/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode })
      });
      const data = (await response.json()) as TelegramBotStartResponse;

      if (!response.ok || !data.ok || !data.data) {
        throw new Error(data.error?.message ?? "Не удалось открыть Telegram");
      }

      setBotToken(data.data.token);
      setBotLoginUrl(data.data.loginUrl);
      setBotExpiresAt(data.data.expiresAt);

      if (popup) {
        popup.location.href = data.data.loginUrl;
      }

      pollingRef.current = window.setInterval(() => {
        void checkBotStatus(data.data!.token);
      }, 2500);

      showToast("Нажмите Start в Telegram, затем вернитесь на сайт.", "info");
    } catch (error) {
      if (popup && !popup.closed) {
        popup.close();
      }
      showToast(error instanceof Error ? error.message : "Не удалось открыть Telegram", "error");
    } finally {
      setStartingBot(false);
    }
  }, [checkBotStatus, clearPolling, mode, showToast]);

  useEffect(() => {
    return clearPolling;
  }, [clearPolling]);

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

        showToast(mode === "link" ? "Telegram привязан" : "Вход через Telegram выполнен", "success");
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
  }, [botUsername, endpoint, mode, onSuccess, showToast]);

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
    <div className="space-y-3">
      <div className={loading ? "pointer-events-none opacity-60" : undefined} ref={containerRef} />

      <button
        type="button"
        className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-sky-300/20 bg-sky-500/15 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading || startingBot || checkingBot}
        onClick={() => void startBotLogin()}
      >
        {startingBot ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {mode === "link" ? "Привязать через Telegram-бота" : "Войти через Telegram-бота"}
      </button>

      {botToken && botLoginUrl ? (
        <div className="rounded-lg border border-sky-300/15 bg-sky-400/[0.06] p-3 text-xs leading-5 text-slate-300">
          <p>
            Нажмите <span className="font-semibold text-sky-100">Start</span> в Telegram, затем вернитесь сюда. Ссылка
            действует {botExpiresAt ? "около 10 минут" : "несколько минут"}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 font-medium text-slate-100 hover:bg-white/[0.1]"
              href={botLoginUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Открыть Telegram
            </a>
            <button
              type="button"
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 font-medium text-slate-100 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={checkingBot}
              onClick={() => void checkBotStatus(botToken, true)}
            >
              {checkingBot ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}Я нажал Start
            </button>
          </div>
        </div>
      ) : null}

      {loading ? <p className="text-xs text-slate-500">Проверяем Telegram...</p> : null}
    </div>
  );
}
