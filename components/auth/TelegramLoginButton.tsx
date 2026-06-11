"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, ExternalLink, RefreshCw, Send, ShieldAlert } from "lucide-react";

import { useToast } from "@/components/Toast";

type TelegramLoginButtonProps = {
  botUsername?: string;
  endpoint: string;
  label?: string;
  isDevelopment?: boolean;
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
  isDevelopment = false,
  onSuccess
}: TelegramLoginButtonProps) {
  const { showToast } = useToast();
  const pollingRef = useRef<number | null>(null);
  const [startingBot, setStartingBot] = useState(false);
  const [checkingBot, setCheckingBot] = useState(false);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [botLoginUrl, setBotLoginUrl] = useState<string | null>(null);
  const [botExpiresAt, setBotExpiresAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const mode = endpoint.includes("/link") ? "link" : "auth";
  const cleanBotUsername = botUsername?.trim().replace(/^@/, "");
  const secondsLeft = botExpiresAt ? Math.max(0, Math.ceil((new Date(botExpiresAt).getTime() - now) / 1000)) : null;
  const minutesLeft = secondsLeft === null ? null : Math.floor(secondsLeft / 60);
  const secondsRemainder = secondsLeft === null ? null : secondsLeft % 60;
  const countdownLabel = useMemo(() => {
    if (minutesLeft === null || secondsRemainder === null) {
      return "10 минут";
    }

    return `${minutesLeft}:${String(secondsRemainder).padStart(2, "0")}`;
  }, [minutesLeft, secondsRemainder]);

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
        if (botExpiresAt && new Date(botExpiresAt).getTime() <= Date.now()) {
          clearPolling();
          setBotToken(null);
          setBotLoginUrl(null);
          setBotExpiresAt(null);
          throw new Error("Срок Telegram-ссылки истёк. Создайте новую.");
        }

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
    [botExpiresAt, clearPolling, completeBotFlow, showToast]
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
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!cleanBotUsername) {
    return (
      <div className="rounded-lg border border-amber-300/20 bg-amber-400/[0.08] p-4 text-sm text-slate-300">
        <div className="flex items-center gap-2 text-amber-100">
          <ShieldAlert className="h-4 w-4" />
          {label}
        </div>
        {isDevelopment ? (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Telegram вход появится после настройки TELEGRAM_BOT_USERNAME и TELEGRAM_BOT_TOKEN в `.env`.
          </p>
        ) : (
          <p className="mt-2 text-xs leading-5 text-slate-500">Telegram вход временно недоступен.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-sky-300/20 bg-sky-500/[0.08] p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-sky-100">
          <Send className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-white">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Откройте @{cleanBotUsername}, нажмите Start и вернитесь сюда для проверки входа.
          </p>
        </div>
      </div>
      <button
        type="button"
        className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-sky-300/25 bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={startingBot || checkingBot}
        onClick={() => void startBotLogin()}
      >
        {startingBot ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {mode === "link" ? "Привязать через Telegram-бота" : "Войти через Telegram-бота"}
      </button>

      {botToken && botLoginUrl ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.05] p-3 text-xs leading-5 text-slate-300">
          <div className="flex items-start gap-2">
            {secondsLeft === 0 ? (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
            ) : (
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-sky-200" />
            )}
            <p>
              {secondsLeft === 0 ? (
                "Срок ссылки истёк. Создайте новую Telegram-ссылку."
              ) : (
                <>
                  Нажмите <span className="font-semibold text-sky-100">Start</span> в Telegram. Ссылка действует{" "}
                  <span className="font-semibold text-sky-100">{countdownLabel}</span>.
                </>
              )}
            </p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 font-medium text-slate-100 hover:bg-white/[0.1]"
              href={botLoginUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Открыть Telegram
            </a>
            <button
              type="button"
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 font-medium text-slate-100 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={checkingBot || secondsLeft === 0}
              onClick={() => void checkBotStatus(botToken, true)}
            >
              {checkingBot ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Проверить вход
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
